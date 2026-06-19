/**
 * patternSearch.ts
 * POST /api/pattern-search
 * Accepts a normalized 100-point pattern and window size.
 * Returns top 20 historical matches ranked by DTW similarity.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchPatterns } from '../services/patternSearch/searchService';
import { isCacheLoaded, getCacheStats } from '../services/patternSearch/patternCacheService';
import { normalizePattern } from '../lib/patternSearch/normalize';
import { logger } from '../utils/logger';

const router = Router();

const VALID_WINDOW_SIZES = [20, 50, 100, 200] as const;

const PatternSearchRequestSchema = z.object({
  pattern: z
    .array(z.number())
    .min(10, 'Pattern must have at least 10 points')
    .max(1000, 'Pattern too long'),
  windowSize: z.union([
    z.literal(20),
    z.literal(50),
    z.literal(100),
    z.literal(200),
  ]).default(50),
  mode: z.enum(['current', 'historical']).default('current'),
});

/**
 * POST /api/pattern-search
 * Body: { pattern: number[], windowSize?: 20 | 50 | 100 | 200, mode?: 'current' | 'historical' }
 */
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const parseResult = PatternSearchRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      details: parseResult.error.flatten(),
    });
  }

  const { pattern, windowSize, mode } = parseResult.data;

  // Normalize the incoming pattern to exactly 100 points in [0, 1]
  const normalizedQuery = normalizePattern(pattern);

  if (!isCacheLoaded()) {
    return res.status(503).json({
      success: false,
      error: 'Pattern search index is still loading. Please try again in a moment.',
    });
  }

  const stats = getCacheStats();
  const vectorCount = stats[windowSize] ?? 0;

  if (vectorCount === 0) {
    return res.status(503).json({
      success: false,
      error: `No pattern vectors found for window size ${windowSize}. Run the precomputation job first.`,
    });
  }

  try {
    const startTime = Date.now();
    const matches = searchPatterns(normalizedQuery, windowSize, mode);
    const durationMs = Date.now() - startTime;

    logger.info(
      `[PatternSearch] windowSize=${windowSize}, vectorsScanned=${vectorCount}, ` +
      `matchesFound=${matches.length}, durationMs=${durationMs}`,
    );

    return res.status(200).json({
      success: true,
      matches,
      meta: {
        windowSize,
        vectorsScanned: vectorCount,
        matchesReturned: matches.length,
        durationMs,
      },
    });
  } catch (err: any) {
    logger.error('[PatternSearch] Search error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pattern-search/status
 * Returns cache health/stats for debugging.
 */
router.get('/status', async (_req: Request, res: Response): Promise<any> => {
  const stats = getCacheStats();
  const totalCached = Object.values(stats).reduce((a, b) => a + b, 0);

  // Also show live DB counts
  let dbStats: Record<string, number> = {};
  try {
    const { default: prisma } = await import('../config/prisma');
    const counts = await prisma.patternVector.groupBy({
      by: ['windowSize'],
      _count: { id: true },
    });
    for (const row of counts) {
      dbStats[row.windowSize] = row._count.id;
    }
  } catch { /* non-fatal */ }

  return res.status(200).json({
    success: true,
    isReady: isCacheLoaded(),
    totalCached,
    cacheStats: stats,
    dbStats,
  });
});

/**
 * POST /api/pattern-search/reload-cache
 * Reload the in-memory pattern cache from DB without restarting the server.
 * Call this after running the seed script or the nightly job manually.
 */
router.post('/reload-cache', async (_req: Request, res: Response): Promise<any> => {
  logger.info('[PatternSearch] Manual cache reload requested...');
  try {
    const { loadPatternCache } = await import('../services/patternSearch/patternCacheService');
    await loadPatternCache();
    const stats = getCacheStats();
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    logger.info(`[PatternSearch] Cache reloaded. Total vectors in memory: ${total}`);
    return res.status(200).json({
      success: true,
      message: 'Pattern cache reloaded successfully.',
      stats,
      totalVectors: total,
    });
  } catch (err: any) {
    logger.error('[PatternSearch] Cache reload failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
