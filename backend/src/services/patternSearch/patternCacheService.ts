/**
 * patternCacheService.ts
 * In-memory cache for pattern_vectors data.
 * Loaded on server startup and refreshed after each nightly job.
 */

import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface CachedVector {
  id: string;
  symbol: string;
  windowSize: number;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  normalizedSeries: number[];
  future5dReturn: number | null;
  future10dReturn: number | null;
  future20dReturn: number | null;
  future50dReturn: number | null;
  maxGain: number | null;
  maxDrawdown: number | null;
}

// Cache: windowSize → list of vectors
const cache = new Map<number, CachedVector[]>();
let isLoaded = false;
let isLoading = false;

/**
 * Load all pattern vectors from the DB into memory, grouped by windowSize.
 * Called once at server startup and after each nightly job completes.
 */
export async function loadPatternCache(): Promise<void> {
  if (isLoading) {
    logger.info('[PatternCache] Load already in progress, skipping duplicate call.');
    return;
  }
  isLoading = true;
  isLoaded = false;
  const startTime = Date.now();
  logger.info('[PatternCache] Loading pattern vectors into memory...');

  try {
    const rows = await prisma.patternVector.findMany({
      select: {
        id: true,
        symbol: true,
        windowSize: true,
        startDate: true,
        endDate: true,
        normalizedSeries: true,
        future5dReturn: true,
        future10dReturn: true,
        future20dReturn: true,
        future50dReturn: true,
        maxGain: true,
        maxDrawdown: true,
      },
    });

    // Clear existing cache
    cache.clear();

    for (const row of rows) {
      const vec: CachedVector = {
        id: row.id,
        symbol: row.symbol,
        windowSize: row.windowSize,
        startDate: row.startDate.toISOString().split('T')[0],
        endDate: row.endDate.toISOString().split('T')[0],
        normalizedSeries: row.normalizedSeries as number[],
        future5dReturn: row.future5dReturn !== null ? Number(row.future5dReturn) : null,
        future10dReturn: row.future10dReturn !== null ? Number(row.future10dReturn) : null,
        future20dReturn: row.future20dReturn !== null ? Number(row.future20dReturn) : null,
        future50dReturn: row.future50dReturn !== null ? Number(row.future50dReturn) : null,
        maxGain: row.maxGain !== null ? Number(row.maxGain) : null,
        maxDrawdown: row.maxDrawdown !== null ? Number(row.maxDrawdown) : null,
      };

      if (!cache.has(row.windowSize)) {
        cache.set(row.windowSize, []);
      }
      cache.get(row.windowSize)!.push(vec);
    }

    isLoaded = true;
    isLoading = false;
    const durationMs = Date.now() - startTime;
    logger.info(
      `[PatternCache] Loaded ${rows.length} vectors across ${cache.size} window sizes in ${durationMs}ms`,
    );
  } catch (err) {
    isLoading = false;
    logger.error('[PatternCache] Failed to load pattern vectors:', err);
    throw err;
  }
}

/**
 * Get cached vectors for a given window size.
 * Returns empty array if cache not yet loaded or window size not found.
 */
export function getVectors(windowSize: number): CachedVector[] {
  return cache.get(windowSize) ?? [];
}

/**
 * Return true if the cache has been loaded successfully.
 */
export function isCacheLoaded(): boolean {
  return isLoaded;
}

/**
 * Return true if a cache load is currently in progress.
 */
export function isCacheLoading(): boolean {
  return isLoading;
}

/**
 * Return cache stats for monitoring.
 */
export function getCacheStats(): Record<number, number> {
  const stats: Record<number, number> = {};
  for (const [ws, vectors] of cache.entries()) {
    stats[ws] = vectors.length;
  }
  return stats;
}
