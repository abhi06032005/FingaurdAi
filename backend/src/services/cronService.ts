import cron from 'node-cron';
import { fetchAndSyncNews, cleanupStaleNews } from './newsService';

/**
 * Initializes and starts all scheduled background cron jobs.
 */
export function initCronJobs(): void {
  console.log('[CronService] Initializing scheduled tasks...');

  // 1. Fetch and parse RSS news feeds every 2 hours
  // Pattern: '0 */2 * * *' (minute 0, every 2 hours)
  cron.schedule('0 */2 * * *', async () => {
    console.log('[CronService] Executing 2-hour scheduled news sync...');
    try {
      await fetchAndSyncNews();
    } catch (err: any) {
      console.error('[CronService] Cron news sync execution failed:', err.message);
    }
  });

  // 2. Clean up stale news older than 48 hours at midnight (12:00 AM)
  // Pattern: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('[CronService] Executing midnight cleanup of stale news...');
    try {
      await cleanupStaleNews();
    } catch (err: any) {
      console.error('[CronService] Cron database cleanup execution failed:', err.message);
    }
  });

  // Run cleanup and then sync on startup to ensure fresh data
  (async () => {
    try {
      console.log('[CronService] Executing startup cleanup and news sync...');
      await cleanupStaleNews();
      await fetchAndSyncNews();
    } catch (err: any) {
      console.error('[CronService] Startup cleanup and news sync failed:', err.message);
    }
  })();
}
