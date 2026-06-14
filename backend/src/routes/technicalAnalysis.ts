import { Router, Request, Response, NextFunction } from 'express';
import { SymbolParamSchema } from '../schemas/analysis.schema';
import { getCachedAnalysis, setCachedAnalysis } from '../services/cache/analysisCache';
import { recalculateAnalysis } from '../services/scoring/recalculator';
import prisma from '../config/prisma';
import AiReport from '../models/AiReport';
import { logger } from '../utils/logger';
import { NIFTY_50_SYMBOLS } from '../config/constants';
import { NIFTY_50_METADATA } from '../services/dataIngestion/nifty50Symbols';

const router = Router();

/**
 * GET /api/stocks
 * Returns the list of all NIFTY 50 stocks with their cached technical strength scores and ratings.
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const caches = await prisma.technicalAnalysisCache.findMany();

    const stocksList = NIFTY_50_SYMBOLS.map((symbol) => {
      const cache = caches.find((c) => c.symbol === symbol);
      const metadata = NIFTY_50_METADATA[symbol];
      
      let technicalScore: number | null = null;
      let technicalRating: 'Very Weak' | 'Weak' | 'Neutral' | 'Strong' | 'Very Strong' = 'Neutral';

      if (cache) {
        technicalScore = Number(cache.technicalScore);
        
        // Extract rating from resultJson
        const result = cache.resultJson as any;
        if (result && result.technicalRating) {
          technicalRating = result.technicalRating;
        } else {
          // Fallback calculation
          if (technicalScore <= 20) technicalRating = 'Very Weak';
          else if (technicalScore <= 40) technicalRating = 'Weak';
          else if (technicalScore <= 60) technicalRating = 'Neutral';
          else if (technicalScore <= 80) technicalRating = 'Strong';
          else technicalRating = 'Very Strong';
        }
      }

      return {
        symbol,
        companyName: metadata?.companyName ?? symbol,
        sector: metadata?.sector ?? 'NIFTY 50',
        technicalScore,
        technicalRating
      };
    });

    res.json({
      count: stocksList.length,
      stocks: stocksList
    });
  } catch (error) {
    next(error);
  }
});

// Helper to validate parameters using Zod
function validateSymbolParam(req: Request, res: Response, next: NextFunction) {
  const result = SymbolParamSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({
      status: 'error',
      message: result.error.issues[0].message
    });
    return;
  }
  next();
}

/**
 * GET /api/stocks/:symbol/technical-analysis
 * Fetches analysis result from cache or recalculates it.
 */
router.get(
  '/:symbol/technical-analysis',
  validateSymbolParam,
  async (req: Request, res: Response, next: NextFunction) => {
    const symbol = req.params.symbol as string;

    try {
      const startTime = Date.now();
      
      // Try Cache layers
      const cachedResult = await getCachedAnalysis(symbol);
      if (cachedResult) {
        // If cachedResult doesn't have an AI summary, trigger background recalculation to fetch/generate it
        if (!cachedResult.aiSummary) {
          logger.info(`Cached result for ${symbol} lacks AI summary. Triggering background recalculation to generate it...`);
          recalculateAnalysis(symbol).catch(err => 
            logger.error(`Failed async recalculation inside cache hit for ${symbol}`, err)
          );
        }

        const durationMs = Date.now() - startTime;
        logger.info(`Served analysis for ${symbol} from cache`, { symbol, durationMs });
        
        res.json({
          ...cachedResult,
          isCached: true
        });
        return;
      }

      // Cache miss -> Perform Recalculation
      logger.info(`Cache miss for ${symbol}. Recalculating analysis...`);
      const freshResult = await recalculateAnalysis(symbol);
      
      const durationMs = Date.now() - startTime;
      logger.info(`Served recalculated analysis for ${symbol}`, { symbol, durationMs });
      
      res.json(freshResult);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stocks/:symbol/candles
 * Returns historical daily candles for TradingView chart display.
 */
router.get(
  '/:symbol/candles',
  validateSymbolParam,
  async (req: Request, res: Response, next: NextFunction) => {
    const symbol = req.params.symbol as string;
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string) : 200;
    const fromQuery = req.query.from as string | undefined;
    const toQuery = req.query.to as string | undefined;

    try {
      const whereClause: any = { symbol };

      if (fromQuery || toQuery) {
        whereClause.date = {};
        if (fromQuery) {
          whereClause.date.gte = new Date(fromQuery);
        }
        if (toQuery) {
          whereClause.date.lte = new Date(toQuery);
        }
      }

      const candles = await prisma.candle.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        take: Math.min(400, limitQuery)
      });

      // Reverse to chronological order (oldest to newest)
      candles.reverse();

      const formatted = candles.map((c) => ({
        time: c.date.toISOString().split('T')[0],
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume)
      }));

      res.json({
        symbol,
        count: formatted.length,
        candles: formatted
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stocks/:symbol/ai-summary
 * Specific endpoint to poll/retrieve the Groq AI summary once generated in the background.
 */
router.get(
  '/:symbol/ai-summary',
  validateSymbolParam,
  async (req: Request, res: Response, next: NextFunction) => {
    const symbol = req.params.symbol as string;

    try {
      // 1. Try to read from Postgres cache first
      const cachedResult = await getCachedAnalysis(symbol);
      if (cachedResult && cachedResult.aiSummary) {
        res.json({
          summary: cachedResult.aiSummary,
          generatedAt: cachedResult.aiGeneratedAt,
          modelUsed: 'llama-3.3-70b-versatile'
        });
        return;
      }

      const lastCandle = await prisma.candle.findFirst({
        where: { symbol },
        orderBy: { date: 'desc' }
      });

      if (!lastCandle) {
        res.json({ summary: null, generatedAt: null });
        return;
      }

      const dateOnly = new Date(lastCandle.date.toISOString().split('T')[0]);

      // 2. Try to read from MongoDB cache (wrapped in try-catch so it won't crash if MongoDB is down)
      let report = null;
      try {
        report = await AiReport.findOne({ symbol, candleDate: dateOnly });
      } catch (mongoError) {
        logger.warn(`MongoDB query failed in /ai-summary route for ${symbol}, proceeding with fallback:`, mongoError);
      }

      if (report) {
        res.json({
          summary: report.summary,
          generatedAt: report.generatedAt.toISOString(),
          modelUsed: report.modelUsed
        });
      } else {
        res.json({
          summary: null,
          generatedAt: null
        });
      }
    } catch (error) {
      logger.error(`Error in /ai-summary route for ${symbol}:`, error);
      // Fallback response instead of 500
      res.json({
        summary: null,
        generatedAt: null
      });
    }
  }
);

export default router;
