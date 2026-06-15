"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWeeklyCleanup = runWeeklyCleanup;
exports.scheduleWeeklyCleanupJob = scheduleWeeklyCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = require("../utils/logger");
/**
 * Executes database maintenance to delete old logs and expired cache elements.
 */
async function runWeeklyCleanup() {
    const startTime = Date.now();
    logger_1.logger.info('[WeeklyCleanupJob] Starting database maintenance and cleanup...');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 1. Prune ingestion logs older than 30 days
        const deletedLogs = await prisma_1.default.ingestionLog.deleteMany({
            where: {
                loggedAt: {
                    lt: thirtyDaysAgo
                }
            }
        });
        // 2. Prune stale cache entries calculated more than 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const deletedCaches = await prisma_1.default.technicalAnalysisCache.deleteMany({
            where: {
                isStale: true,
                calculatedAt: {
                    lt: sevenDaysAgo
                }
            }
        });
        const durationMs = Date.now() - startTime;
        logger_1.logger.info(`[WeeklyCleanupJob] Maintenance completed successfully. Pruned ${deletedLogs.count} ingestion logs and ${deletedCaches.count} stale cache rows.`, { durationMs });
    }
    catch (error) {
        logger_1.logger.error('[WeeklyCleanupJob] Failed to execute database maintenance:', error);
    }
}
/**
 * Initializes the weekly maintenance cron job scheduler.
 * Runs every Sunday at 00:00 (midnight) in the Asia/Kolkata timezone.
 */
function scheduleWeeklyCleanupJob() {
    node_cron_1.default.schedule('0 0 * * 0', async () => {
        logger_1.logger.info('[Scheduler] Triggering scheduled Weekly Database Cleanup Job...');
        try {
            await runWeeklyCleanup();
        }
        catch (jobError) {
            logger_1.logger.error('[Scheduler] Scheduled Weekly Database Cleanup Job encountered an uncaught error:', jobError);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });
    logger_1.logger.info('[Scheduler] Weekly Cleanup Job successfully scheduled at 00:00 Sundays.');
}
