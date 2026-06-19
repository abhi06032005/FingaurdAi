import cron from 'node-cron';
import { logger } from '../utils/logger';
import { runMetricsUpsertForAllSymbols, seedStockMetadata } from '../services/screener/metricsUpsertService';
import { isMarketHolidayOrWeekend, getKolkataDate } from '../utils/dateUtils';

/**
 * Manually trigger a full metrics computation run (admin use).
 */
export async function runScreenerMetricsJob(): Promise<void> {
  const today = getKolkataDate();
  const runDateStr = today.toISOString().split('T')[0];

  logger.info(`[ScreenerMetricsJob] Starting metrics computation for ${runDateStr}`);

  try {
    // Ensure metadata is seeded
    await seedStockMetadata();

    const result = await runMetricsUpsertForAllSymbols();

    logger.info(
      `[ScreenerMetricsJob] Completed. ` +
      `Symbols: ${result.totalSymbols}, ` +
      `OK: ${result.successful}, ` +
      `Failed: ${result.failed}, ` +
      `Skipped: ${result.skipped}, ` +
      `Duration: ${result.durationMs}ms`
    );
  } catch (err) {
    logger.error('[ScreenerMetricsJob] Uncaught error during metrics job', { err });
    throw err;
  }
}

/**
 * Schedules the screener metrics job at 16:15 IST on weekdays (after NSE close + 15-min buffer).
 * Run order: daily ingestion job (15:45) → screener metrics job (16:15)
 */
export function scheduleScreenerMetricsJob(): void {
  cron.schedule('15 16 * * 1-5', async () => {
    const today = getKolkataDate();

    if (isMarketHolidayOrWeekend(today)) {
      logger.info('[ScreenerMetricsJob] Skipping: market holiday or weekend.');
      return;
    }

    logger.info('[ScreenerMetricsJob] Triggered by scheduler at 16:15 IST...');
    try {
      await runScreenerMetricsJob();
    } catch (err) {
      logger.error('[ScreenerMetricsJob] Scheduled run failed', { err });
    }
  }, {
    timezone: 'Asia/Kolkata',
  } as any);

  logger.info('[Scheduler] Screener Metrics Job scheduled at 16:15 IST weekdays.');
}
