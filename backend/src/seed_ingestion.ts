import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import prisma from './config/prisma';
import { NIFTY_50_SYMBOLS } from './config/constants';
import { fetchCandlesForSymbol } from './services/dataIngestion/yahooFetcher';
import { invalidateCache } from './services/cache/analysisCache';
import { recalculateAnalysis } from './services/scoring/recalculator';
import { getKolkataDate } from './utils/dateUtils';
import { logger } from './utils/logger';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSeedIngestion() {
  const startTime = Date.now();
  const today = getKolkataDate();
  const runDateStr = today.toISOString().split('T')[0];



  logger.info(`[SeedIngestion] Starting seed ingestion job on date ${runDateStr} (bypassing holiday checks)...`);

  let totalProcessed = 0;
  let totalFailed = 0;

  for (const symbol of NIFTY_50_SYMBOLS) {
    const symbolStartTime = Date.now();
    try {
      const candleCount = await prisma.candle.count({
        where: { symbol }
      });

      // Seeding should force get historical 400 candles if there is no data
      const isNew = candleCount === 0;

      logger.info(`[SeedIngestion] Processing ${symbol} (candles currently in DB: ${candleCount})...`);

      // Fetch candles
      const candles = await fetchCandlesForSymbol(symbol, isNew);

      if (candles.length > 0) {
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

        const insertResult = await prisma.candle.createMany({
          data: records,
          skipDuplicates: true
        });

        const durationMs = Date.now() - symbolStartTime;

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
        logger.info(`[SeedIngestion] Ingested ${insertResult.count} new candles for ${symbol}.`);
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

      logger.error(`[SeedIngestion] Failed to ingest candles for ${symbol}: ${errMsg}`);

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
        logger.error(`[SeedIngestion] Failed writing error log to database`, logError);
      }
    }

    // Wait 500ms between requests to avoid yfinance rate limits
    await delay(500);
  }

  // Invalidate Cache Layers
  logger.info('[SeedIngestion] Invalidation cache layers...');
  await invalidateCache();

  // Warming cache sequentially
  logger.info('[SeedIngestion] Warming cache sequentially for all symbols (skipping AI Groq requests to save tokens)...');
  for (const symbol of NIFTY_50_SYMBOLS) {
    try {
      await recalculateAnalysis(symbol, true); // skipAi = true
      await delay(100);
    } catch (recalcError) {
      logger.error(`[SeedIngestion] Recalculation failed for ${symbol} during warmup:`, recalcError);
    }
  }

  const jobDurationMs = Date.now() - startTime;
  logger.info(`[SeedIngestion] Seeding finished. Processed: ${totalProcessed}, Failed: ${totalFailed}, Duration: ${jobDurationMs}ms`);
}

runSeedIngestion()
  .then(async () => {
    await prisma.$disconnect();
    logger.info('[SeedIngestion] Done.');
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error('[SeedIngestion] Uncaught script crash:', err);
    try {
      await prisma.$disconnect();
    } catch {}
    process.exit(1);
  });
