import cron from 'node-cron';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

/**
 * Executes database maintenance to delete old logs and expired cache elements.
 */
export async function runWeeklyCleanup(): Promise<void> {
  const startTime = Date.now();
  logger.info('[WeeklyCleanupJob] Starting database maintenance and cleanup...');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Prune ingestion logs older than 30 days
    const deletedLogs = await prisma.ingestionLog.deleteMany({
      where: {
        loggedAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // 2. Prune stale cache entries calculated more than 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const deletedCaches = await prisma.technicalAnalysisCache.deleteMany({
      where: {
        isStale: true,
        calculatedAt: {
          lt: sevenDaysAgo
        }
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info(`[WeeklyCleanupJob] Maintenance completed successfully. Pruned ${deletedLogs.count} ingestion logs and ${deletedCaches.count} stale cache rows.`, { durationMs });
  } catch (error) {
    logger.error('[WeeklyCleanupJob] Failed to execute database maintenance:', error);
  }
}

/**
 * Initializes the weekly maintenance cron job scheduler.
 * Runs every Sunday at 00:00 (midnight) in the Asia/Kolkata timezone.
 */
export function scheduleWeeklyCleanupJob(): void {
  cron.schedule('0 0 * * 0', async () => {
    logger.info('[Scheduler] Triggering scheduled Weekly Database Cleanup Job...');
    try {
      await runWeeklyCleanup();
    } catch (jobError) {
      logger.error('[Scheduler] Scheduled Weekly Database Cleanup Job encountered an uncaught error:', jobError);
    }
  }, {
    timezone: 'Asia/Kolkata'
  } as any);
  logger.info('[Scheduler] Weekly Cleanup Job successfully scheduled at 00:00 Sundays.');
}
