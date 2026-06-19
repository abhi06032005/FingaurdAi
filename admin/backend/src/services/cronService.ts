import cron from 'node-cron';
import { reconcilePendingPayments } from './paymentReconciliation';

/**
 * Initializes and starts all scheduled background cron jobs.
 */
export function initCronJobs(): void {
  console.log('[CronService] Initializing scheduled tasks...');


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
      console.log('[CronService] Executing startup payment reconciliation...');
      await reconcilePendingPayments();
    } catch (err: any) {
      console.error('[CronService] Startup tasks failed:', err.message);
    }
  })();
}

