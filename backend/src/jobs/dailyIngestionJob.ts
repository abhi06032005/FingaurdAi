import cron from 'node-cron';
import prisma from '../config/prisma';
import { NIFTY_50_SYMBOLS } from '../config/constants';
import { fetchCandlesForSymbol } from '../services/dataIngestion/yahooFetcher';
import { invalidateCache } from '../services/cache/analysisCache';
import { recalculateAnalysis } from '../services/scoring/recalculator';
import { isMarketHolidayOrWeekend, getKolkataDate } from '../utils/dateUtils';
import { logger } from '../utils/logger';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the daily NIFTY 50 stock market ingestion process.
 */
export async function runDailyIngestion(): Promise<void> {
  const startTime = Date.now();
  const today = getKolkataDate();
  const runDateStr = today.toISOString().split('T')[0];

  logger.info(`[DailyIngestionJob] Starting ingestion job for ${runDateStr}`);

  // Skip if today is a weekend or listed NSE holiday
  if (isMarketHolidayOrWeekend(today)) {
    logger.info(`[DailyIngestionJob] Skipping execution: today (${runDateStr}) is a market holiday or weekend.`);
    return;
  }

  let totalProcessed = 0;
  let totalFailed = 0;

  for (const symbol of NIFTY_50_SYMBOLS) {
    const symbolStartTime = Date.now();
    try {
      // Check if this symbol already has candles in the database
      const candleCount = await prisma.candle.count({
        where: { symbol }
      });

      const isNew = candleCount === 0;

      // Fetch candles (400 days if new symbol, 5 days if existing to handle latency and weekends)
      const candles = await fetchCandlesForSymbol(symbol, isNew);

      if (candles.length > 0) {
        // Prepare prisma rows
        const records = candles.map((c) => ({
          symbol: c.symbol,
          date: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          dataQuality: c.dataQuality
        }));

        // Bulk insert to PostgreSQL, skipping matching primary keys
        const insertResult = await prisma.candle.createMany({
          data: records,
          skipDuplicates: true
        });

        const durationMs = Date.now() - symbolStartTime;

        // Log success in database IngestionLog
        await prisma.ingestionLog.create({
          data: {
            symbol,
            runDate: today,
            status: 'success',
            candlesFetched: insertResult.count,
            durationMs
          }
        });

        totalProcessed++;
        logger.info(`[DailyIngestionJob] Ingested ${insertResult.count} candles for ${symbol} successfully.`);
      } else {
        await prisma.ingestionLog.create({
          data: {
            symbol,
            runDate: today,
            status: 'skipped',
            errorMessage: 'No new candles found'
          }
        });
        totalProcessed++;
      }
    } catch (err: unknown) {
      totalFailed++;
      const errMsg = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - symbolStartTime;

      logger.error(`[DailyIngestionJob] Failed to ingest candles for ${symbol}: ${errMsg}`, { symbol, err });

      try {
        await prisma.ingestionLog.create({
          data: {
            symbol,
            runDate: today,
            status: 'failed',
            errorMessage: errMsg,
            durationMs
          }
        });
      } catch (logError) {
        logger.error(`[DailyIngestionJob] Failed writing error log to database`, logError);
      }
    }

    // Wait 500ms between requests to avoid rate limits
    await delay(500);
  }

  // 2. Invalidate Cache Layers after fetching completes
  logger.info('[DailyIngestionJob] Ingest completes. Invalidating cache layers...');
  await invalidateCache();

  // 3. Recalculate analysis for all 50 symbols to warm caches and create ScoreHistory
  logger.info('[DailyIngestionJob] Warming cache by recalculating all 50 symbols sequentially...');
  for (const symbol of NIFTY_50_SYMBOLS) {
    try {
      await recalculateAnalysis(symbol, true);
      await delay(100);
    } catch (recalcError) {
      logger.error(`[DailyIngestionJob] Recalculation failed for ${symbol} during post-ingest warmup`, { symbol, recalcError });
    }
  }

  const jobDurationMs = Date.now() - startTime;
  logger.info(`[DailyIngestionJob] Ingestion job finished. Processed: ${totalProcessed}, Failed: ${totalFailed}, Total Duration: ${jobDurationMs}ms`);
}

/**
 * Initializes the node-cron scheduler for the daily ingestion task.
 * Scheduled to run at 15:45 (3:45 PM) Asia/Kolkata timezone, Monday through Friday.
 */
export function scheduleDailyIngestionJob(): void {
  cron.schedule('45 15 * * 1-5', async () => {
    logger.info('[Scheduler] Triggering scheduled Daily Market Ingestion Job...');
    try {
      await runDailyIngestion();
    } catch (jobError) {
      logger.error('[Scheduler] Scheduled Daily Market Ingestion Job encountered an uncaught error:', jobError);
    }
  }, {
    timezone: 'Asia/Kolkata'
  } as any);
  logger.info('[Scheduler] Daily Ingestion Job successfully scheduled at 15:45 IST Weekdays.');
}
