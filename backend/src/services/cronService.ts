import cron from 'node-cron';
import { fetchAndSyncNews, cleanupStaleNews } from './newsService';
import { reconcilePendingPayments } from '../routes/payments';

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

  // 3. Reconcile pending payments every 5 minutes
  // Pattern: '*/5 * * * *' (every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CronService] Executing scheduled payments reconciliation...');
    try {
      await reconcilePendingPayments();
    } catch (err: any) {
      console.error('[CronService] Cron payments reconciliation failed:', err.message);
    }
  });

  // Run cleanup, sync, and payment reconciliation on startup to ensure fresh data
  (async () => {
    try {
      console.log('[CronService] Executing startup cleanup, news sync, and payment reconciliation...');
      await cleanupStaleNews();
      await fetchAndSyncNews();
      await reconcilePendingPayments();
    } catch (err: any) {
      console.error('[CronService] Startup tasks failed:', err.message);
    }
  })();
}

