"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const newsService_1 = require("./newsService");
/**
 * Initializes and starts all scheduled background cron jobs.
 */
function initCronJobs() {
    console.log('[CronService] Initializing scheduled tasks...');
    // 1. Fetch and parse RSS news feeds every 2 hours
    // Pattern: '0 */2 * * *' (minute 0, every 2 hours)
    node_cron_1.default.schedule('0 */2 * * *', async () => {
        console.log('[CronService] Executing 2-hour scheduled news sync...');
        try {
            await (0, newsService_1.fetchAndSyncNews)();
        }
        catch (err) {
            console.error('[CronService] Cron news sync execution failed:', err.message);
        }
    });
    // 2. Clean up stale news older than 48 hours at midnight (12:00 AM)
    // Pattern: '0 0 * * *'
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('[CronService] Executing midnight cleanup of stale news...');
        try {
            await (0, newsService_1.cleanupStaleNews)();
        }
        catch (err) {
            console.error('[CronService] Cron database cleanup execution failed:', err.message);
        }
    });
    // Run cleanup and then sync on startup to clear old data immediately
    (async () => {
        try {
            console.log('[CronService] Executing startup cleanup and news sync...');
            await (0, newsService_1.cleanupStaleNews)();
            await (0, newsService_1.fetchAndSyncNews)();
        }
        catch (err) {
            console.error('[CronService] Startup cleanup and news sync failed:', err.message);
        }
    })();
}
