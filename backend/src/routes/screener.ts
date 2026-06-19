import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { parseScreenerQuery, ScreenerFilter } from '../services/screener/aiQueryParser';
import { buildPrismaWhereClause, describeFilter } from '../services/screener/queryBuilder';
import { executeScreenerQuery } from '../services/screener/resultsEngine';
import { generateScreenerExplanation } from '../services/screener/explanationService';
import { logger } from '../utils/logger';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const QueryBodySchema = z.object({
  query: z.string().min(3).max(500),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const FilterBodySchema = z.object({
  filter: z.record(z.string(), z.unknown()),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Suggested Queries ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { id: 'above_20sma_down4', label: 'Above 20 SMA, down >4%', query: 'Stocks above 20 SMA and down more than 4% today' },
  { id: 'sma_cross_50_100', label: '50/100 SMA Crossover', query: 'Stocks where 50 SMA crossed above 100 SMA' },
  { id: 'largecap_it_rsi40', label: 'Large Cap IT — RSI < 40', query: 'Large cap IT stocks with RSI below 40' },
  { id: 'above_200sma_vol2x', label: '200 SMA + Volume Spike', query: 'Stocks above 200 SMA with volume 2x average' },
  { id: 'breakout_rsi60', label: 'Breakout + RSI > 60', query: 'Breakout stocks with RSI above 60' },
  { id: 'new_52w_high', label: 'New 52-Week Highs', query: 'Stocks making new 52-week highs' },
  { id: 'macd_bullish', label: 'MACD Bullish Crossover', query: 'High momentum stocks with MACD bullish crossover' },
  { id: 'pharma_rsi_os', label: 'Pharma RSI Oversold', query: 'Pharma stocks with RSI below 30' },
  { id: 'golden_cross', label: 'Golden Cross', query: 'Stocks with 50 SMA golden cross above 200 SMA' },
];

// ─── GET /api/screener/suggestions ────────────────────────────────────────────

router.get('/suggestions', (_req: Request, res: Response): any => {
  return res.json({ success: true, suggestions: SUGGESTIONS });
});

// ─── POST /api/screener/query (AI-powered) ────────────────────────────────────

router.post('/query', async (req: Request, res: Response): Promise<any> => {
  const parsed = QueryBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { query, page, limit, sortBy, sortOrder } = parsed.data;
  const startTime = Date.now();

  try {
    // Step 1: Parse NL query → filter JSON
    const filter: ScreenerFilter = await parseScreenerQuery(query);
    logger.info(`[ScreenerRoute] Parsed filter: ${JSON.stringify(filter)}`);

    // Step 2: Build Prisma WHERE clause
    const where = buildPrismaWhereClause(filter);

    // Step 3: Execute query
    const results = await executeScreenerQuery(where, {
      limit,
      page,
      sortBy: (sortBy as any) ?? 'relevanceScore',
      sortOrder,
    });

    // Step 4: Generate explanation (non-blocking, can fail gracefully)
    let explanation = '';
    try {
      explanation = await generateScreenerExplanation(query, filter, results);
    } catch {
      explanation = `${results.total} stocks matched your query.`;
    }

    const durationMs = Date.now() - startTime;

    return res.json({
      success: true,
      query,
      filter,
      filterDescription: describeFilter(filter),
      explanation,
      ...results,
      durationMs,
    });
  } catch (err: any) {
    logger.error('[ScreenerRoute] /query error', { err });
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/screener/filter (raw JSON filter, no AI) ───────────────────────

router.post('/filter', async (req: Request, res: Response): Promise<any> => {
  const parsed = FilterBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { filter, page, limit, sortBy, sortOrder } = parsed.data;
  const startTime = Date.now();

  try {
    const screenerFilter = filter as ScreenerFilter;
    const where = buildPrismaWhereClause(screenerFilter);

    const results = await executeScreenerQuery(where, {
      limit,
      page,
      sortBy: (sortBy as any) ?? 'relevanceScore',
      sortOrder,
    });

    return res.json({
      success: true,
      filter: screenerFilter,
      filterDescription: describeFilter(screenerFilter),
      ...results,
      durationMs: Date.now() - startTime,
    });
  } catch (err: any) {
    logger.error('[ScreenerRoute] /filter error', { err });
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/screener/status ────────────────────────────────────────────────

router.get('/status', async (_req: Request, res: Response): Promise<any> => {
  try {
    const count = await (prisma as any).stockMetrics.count();
    const latest = count > 0
      ? await (prisma as any).stockMetrics.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, candleDate: true } })
      : null;

    return res.json({
      success: true,
      stockMetricsCount: count,
      isReady: count > 0,
      lastUpdated: latest?.updatedAt ?? null,
      lastCandleDate: latest?.candleDate ?? null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/screener/admin/refresh ────────────────────────────────────────

router.post('/admin/refresh', async (req: Request, res: Response): Promise<any> => {
  logger.info('[ScreenerRoute] Admin refresh triggered. Delegating to admin backend...');

  const adminUrl = process.env.ADMIN_SERVICE_URL || 'http://localhost:5001';
  fetch(`${adminUrl}/internal/refresh-screener`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(err =>
    logger.error('[ScreenerRoute] Admin refresh delegation failed', { err })
  );

  return res.json({
    success: true,
    message: 'Screener metrics refresh job started. Check /api/screener/status for progress.',
  });
});

export default router;
