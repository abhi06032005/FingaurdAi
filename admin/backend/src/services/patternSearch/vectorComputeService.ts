/**
 * vectorComputeService.ts
 * Nightly precomputation: generates rolling windows of closing prices for all
 * Nifty 50 symbols, normalizes them to 100 points, computes future returns,
 * and upserts into the pattern_vectors table.
 */

import prisma from '../../config/prisma';
import { NIFTY_50_SYMBOLS } from '../../schemas/analysis.schema';
import { normalizePattern } from '../../lib/patternSearch/normalize';
import { logger } from '../../utils/logger';

const WINDOW_SIZES = [20, 50, 100, 200];

interface WindowResult {
  symbol: string;
  windowSize: number;
  startDate: Date;
  endDate: Date;
  normalizedSeries: number[];
  future5dReturn: number | null;
  future10dReturn: number | null;
  future20dReturn: number | null;
  future50dReturn: number | null;
  maxGain: number | null;
  maxDrawdown: number | null;
}

/**
 * Compute future return (%) from endIdx to endIdx + horizon.
 * Returns null if insufficient data.
 */
function futureReturn(closes: number[], endIdx: number, horizon: number): number | null {
  const futureIdx = endIdx + horizon;
  if (futureIdx >= closes.length) return null;
  const base = closes[endIdx];
  if (base === 0) return null;
  return ((closes[futureIdx] - base) / base) * 100;
}

/**
 * Compute max gain and max drawdown over the next `horizon` candles after endIdx.
 */
function computeMaxGainDrawdown(
  closes: number[],
  endIdx: number,
  horizon: number,
): { maxGain: number | null; maxDrawdown: number | null } {
  const base = closes[endIdx];
  if (!base || endIdx + 1 >= closes.length) return { maxGain: null, maxDrawdown: null };

  const end = Math.min(closes.length, endIdx + 1 + horizon);
  let maxGain = -Infinity;
  let maxDrawdown = Infinity;

  for (let i = endIdx + 1; i < end; i++) {
    const ret = ((closes[i] - base) / base) * 100;
    if (ret > maxGain) maxGain = ret;
    if (ret < maxDrawdown) maxDrawdown = ret;
  }

  return {
    maxGain: maxGain === -Infinity ? null : maxGain,
    maxDrawdown: maxDrawdown === Infinity ? null : maxDrawdown,
  };
}

/**
 * Generate all rolling windows for a single symbol.
 */
function generateWindowsForSymbol(
  symbol: string,
  dates: Date[],
  closes: number[],
  windowSize: number,
): WindowResult[] {
  const results: WindowResult[] = [];

  for (let i = 0; i + windowSize - 1 < closes.length; i++) {
    const windowCloses = closes.slice(i, i + windowSize);
    const startDate = dates[i];
    const endIdx = i + windowSize - 1;
    const endDate = dates[endIdx];

    const normalizedSeries = normalizePattern(windowCloses);

    const future5dReturn = futureReturn(closes, endIdx, 5);
    const future10dReturn = futureReturn(closes, endIdx, 10);
    const future20dReturn = futureReturn(closes, endIdx, 20);
    const future50dReturn = futureReturn(closes, endIdx, 50);
    const { maxGain, maxDrawdown } = computeMaxGainDrawdown(closes, endIdx, 50);

    results.push({
      symbol,
      windowSize,
      startDate,
      endDate,
      normalizedSeries,
      future5dReturn,
      future10dReturn,
      future20dReturn,
      future50dReturn,
      maxGain,
      maxDrawdown,
    });
  }

  return results;
}

/**
 * Main entry point. Runs for all NIFTY 50 symbols and all window sizes.
 * Upserts results into pattern_vectors.
 */
export async function computeAllPatternVectors(): Promise<{
  totalInserted: number;
  totalSkipped: number;
  durationMs: number;
}> {
  const startTime = Date.now();
  let totalInserted = 0;
  let totalSkipped = 0;

  logger.info('[PatternVectorService] Starting full precomputation...');

  for (const symbol of NIFTY_50_SYMBOLS as readonly string[]) {
    try {
      // Fetch all candles ascending
      const candles = await prisma.candle.findMany({
        where: { symbol },
        orderBy: { date: 'asc' },
        select: { date: true, close: true },
      });

      if (candles.length < 20) {
        logger.warn(`[PatternVectorService] Insufficient candles for ${symbol}: ${candles.length}`);
        totalSkipped++;
        continue;
      }

      const dates = candles.map(c => c.date);
      const closes = candles.map(c => Number(c.close));

      for (const windowSize of WINDOW_SIZES) {
        if (closes.length < windowSize) continue;

        const windows = generateWindowsForSymbol(symbol, dates, closes, windowSize);

        // Batch upsert in chunks of 500
        const BATCH = 500;
        for (let b = 0; b < windows.length; b += BATCH) {
          const chunk = windows.slice(b, b + BATCH);

          // Use createMany with skipDuplicates for performance
          const res = await prisma.patternVector.createMany({
            data: chunk.map(w => ({
              symbol: w.symbol,
              windowSize: w.windowSize,
              startDate: w.startDate,
              endDate: w.endDate,
              normalizedSeries: w.normalizedSeries as any,
              future5dReturn: w.future5dReturn,
              future10dReturn: w.future10dReturn,
              future20dReturn: w.future20dReturn,
              future50dReturn: w.future50dReturn,
              maxGain: w.maxGain,
              maxDrawdown: w.maxDrawdown,
            })),
            skipDuplicates: true,
          });

          totalInserted += res.count;
        }

        logger.info(`[PatternVectorService] ${symbol} window=${windowSize}: ${windows.length} windows computed`);
      }
    } catch (err) {
      logger.error(`[PatternVectorService] Error for ${symbol}:`, err);
      totalSkipped++;
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info(
    `[PatternVectorService] Done. Inserted: ${totalInserted}, Skipped symbols: ${totalSkipped}, Duration: ${durationMs}ms`,
  );

  return { totalInserted, totalSkipped, durationMs };
}
