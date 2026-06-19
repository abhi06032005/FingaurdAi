import { Router, Request, Response, NextFunction } from 'express';
import { generateAndStoreAIReport } from '../services/aiReportService';
import { recalculateAnalysis } from '../services/scoring/recalculator';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /internal/generate-report
 * Body: { ticker: string, force?: boolean }
 */
router.post('/generate-report', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { ticker, force } = req.body;

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "ticker" in request body.',
    });
  }

  const symbol = ticker.toUpperCase().trim();
  const forceRegenerate = !!force;

  logger.info(`[InternalRoute] Triggering AI report generation for ${symbol} (force: ${forceRegenerate})`);

  // Respond 202 immediately and run in background
  res.status(202).json({
    success: true,
    message: `AI report generation started for ${symbol}.`,
    ticker: symbol,
  });

  (async () => {
    try {
      const result = await generateAndStoreAIReport(symbol, forceRegenerate);
      if (result.success) {
        logger.info(`[InternalRoute] ✓ AI Report generated for ${symbol}`);
      } else {
        logger.error(`[InternalRoute] ✗ AI Report generation failed for ${symbol}: ${result.error}`);
      }
    } catch (err: any) {
      logger.error(`[InternalRoute] ✗ AI Report generation unhandled error for ${symbol}: ${err.message}`);
    }
  })();
});

/**
 * POST /internal/recalculate
 * Body: { symbol: string }
 */
router.post('/recalculate', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { symbol } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "symbol" in request body.',
    });
  }

  const ticker = symbol.toUpperCase().trim();

  logger.info(`[InternalRoute] Recalculating analysis for ${ticker}`);

  try {
    const result = await recalculateAnalysis(ticker);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`[InternalRoute] Recalculation failed for ${ticker}: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal recalculation failed',
    });
  }
});

/**
 * POST /internal/refresh-screener
 */
router.post('/refresh-screener', async (req: Request, res: Response): Promise<any> => {
  logger.info('[InternalRoute] Triggering Screener Metrics Job');
  
  res.status(202).json({
    success: true,
    message: 'Screener metrics refresh job started.',
  });

  const { runScreenerMetricsJob } = await import('../jobs/screenerMetricsJob');
  (async () => {
    try {
      await runScreenerMetricsJob();
      logger.info('[InternalRoute] ✓ Screener Metrics Job completed successfully.');
    } catch (err: any) {
      logger.error('[InternalRoute] ✗ Screener Metrics Job failed:', err.message);
    }
  })();
});

export default router;
