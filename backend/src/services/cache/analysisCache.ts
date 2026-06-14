import NodeCache from 'node-cache';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';
import { round } from '../../utils/mathUtils';

// Layer 1 - In-Memory Cache (TTL: 1 hour)
const memoryCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

/**
 * Retreives the cached technical analysis results.
 * Check Memory Cache -> Check PostgreSQL Cache -> Return null if miss.
 */
export async function getCachedAnalysis(symbol: string): Promise<any | null> {
  const memKey = `ta:${symbol}`;
  
  // 1. Check Memory Cache
  const memoryHit = memoryCache.get(memKey);
  if (memoryHit) {
    logger.info(`Layer 1 Memory cache hit for ${symbol}`);
    return memoryHit;
  }

  // 2. Check Database Cache
  try {
    const dbCache = await prisma.technicalAnalysisCache.findUnique({
      where: { symbol }
    });

    if (dbCache) {
      if (!dbCache.isStale) {
        logger.info(`Layer 2 PostgreSQL cache hit for ${symbol}`);
        
        const result = dbCache.resultJson;
        
        // Pop back into memory cache
        memoryCache.set(memKey, result);
        return result;
      } else {
        logger.info(`PostgreSQL cache found for ${symbol} but is flagged as stale`);
      }
    }
  } catch (error) {
    logger.error(`Failed to read database cache for ${symbol}`, { error });
  }

  return null;
}

/**
 * Saves analysis results to both in-memory cache and PostgreSQL database.
 */
export async function setCachedAnalysis(
  symbol: string,
  resultJson: any,
  technicalScore: number,
  candleDate: Date
): Promise<void> {
  const memKey = `ta:${symbol}`;
  
  // Update Memory Cache
  memoryCache.set(memKey, resultJson);

  // Update Database Cache
  const normalizedDate = new Date(candleDate.toISOString().split('T')[0]);

  try {
    await prisma.technicalAnalysisCache.upsert({
      where: { symbol },
      update: {
        resultJson: resultJson as any,
        technicalScore: Number(round(technicalScore, 2)),
        candleDate: normalizedDate,
        calculatedAt: new Date(),
        isStale: false
      },
      create: {
        symbol,
        resultJson: resultJson as any,
        technicalScore: Number(round(technicalScore, 2)),
        candleDate: normalizedDate,
        isStale: false
      }
    });
    logger.info(`Updated database cache for ${symbol}`);
  } catch (error) {
    logger.error(`Failed to write database cache for ${symbol}`, { error });
  }
}

/**
 * Invalidates all cache. Called after new daily data is ingested.
 */
export async function invalidateCache(): Promise<void> {
  // Clear memory cache
  memoryCache.flushAll();
  logger.info('Flushed in-memory analysis cache');

  try {
    // Set isStale = true in PostgreSQL
    await prisma.technicalAnalysisCache.updateMany({
      data: {
        isStale: true
      }
    });
    logger.info('Marked all database cache rows as stale');
  } catch (error) {
    logger.error('Failed to invalidate database cache', { error });
  }
}
