/**
 * patternVectorJob.ts
 * Scheduled nightly job to precompute pattern vectors.
 * Runs at 16:30 IST on weekdays (after ingestion at 15:45 and screener at 16:15).
 * Also calls loadPatternCache() after each run to keep in-memory cache fresh.
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { computeAllPatternVectors } from '../services/patternSearch/vectorComputeService';
import { loadPatternCache } from '../services/patternSearch/patternCacheService';
import { isMarketHolidayOrWeekend, getKolkataDate } from '../utils/dateUtils';

/**
 * Manually trigger a full pattern vector computation + cache refresh.
 * Call this from admin routes or for initial seeding.
 */
export async function runPatternVectorJob(): Promise<void> {
  const today = getKolkataDate();
  const runDateStr = today.toISOString().split('T')[0];

  logger.info(`[PatternVectorJob] Starting pattern vector computation for ${runDateStr}`);

  try {
    const result = await computeAllPatternVectors();

    logger.info(
      `[PatternVectorJob] Computation complete. ` +
      `Inserted: ${result.totalInserted}, Skipped: ${result.totalSkipped}, Duration: ${result.durationMs}ms`,
    );

    // Refresh in-memory cache after computation
    logger.info('[PatternVectorJob] Refreshing in-memory pattern cache...');
    await loadPatternCache();
    logger.info('[PatternVectorJob] Cache refreshed successfully.');
  } catch (err) {
    logger.error('[PatternVectorJob] Uncaught error during pattern vector job', { err });
    throw err;
  }
}

/**
 * Schedule the pattern vector job at 16:30 IST on weekdays.
 * Run order: dailyIngestionJob (15:45) → screenerMetricsJob (16:15) → patternVectorJob (16:30)
 */
export function schedulePatternVectorJob(): void {
  cron.schedule('30 16 * * 1-5', async () => {
    const today = getKolkataDate();

    if (isMarketHolidayOrWeekend(today)) {
      logger.info('[PatternVectorJob] Skipping: market holiday or weekend.');
      return;
    }

    logger.info('[PatternVectorJob] Triggered by scheduler at 16:30 IST...');
    try {
      await runPatternVectorJob();
    } catch (err) {
      logger.error('[PatternVectorJob] Scheduled run failed', { err });
    }
  }, {
    timezone: 'Asia/Kolkata',
  } as any);

  logger.info('[Scheduler] Pattern Vector Job scheduled at 16:30 IST weekdays.');
}
