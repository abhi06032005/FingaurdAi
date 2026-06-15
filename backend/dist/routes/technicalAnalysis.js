"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysis_schema_1 = require("../schemas/analysis.schema");
const analysisCache_1 = require("../services/cache/analysisCache");
const recalculator_1 = require("../services/scoring/recalculator");
const prisma_1 = __importDefault(require("../config/prisma"));
const AiReport_1 = __importDefault(require("../models/AiReport"));
const logger_1 = require("../utils/logger");
const constants_1 = require("../config/constants");
const nifty50Symbols_1 = require("../services/dataIngestion/nifty50Symbols");
const router = (0, express_1.Router)();
/**
 * GET /api/stocks
 * Returns the list of all NIFTY 50 stocks with their cached technical strength scores and ratings.
 */
router.get('/', async (_req, res, next) => {
    try {
        const caches = await prisma_1.default.technicalAnalysisCache.findMany();
        const stocksList = constants_1.NIFTY_50_SYMBOLS.map((symbol) => {
            const cache = caches.find((c) => c.symbol === symbol);
            const metadata = nifty50Symbols_1.NIFTY_50_METADATA[symbol];
            let technicalScore = null;
            let technicalRating = 'Neutral';
            if (cache) {
                technicalScore = Number(cache.technicalScore);
                // Extract rating from resultJson
                const result = cache.resultJson;
                if (result && result.technicalRating) {
                    technicalRating = result.technicalRating;
                }
                else {
                    // Fallback calculation
                    if (technicalScore <= 20)
                        technicalRating = 'Very Weak';
                    else if (technicalScore <= 40)
                        technicalRating = 'Weak';
                    else if (technicalScore <= 60)
                        technicalRating = 'Neutral';
                    else if (technicalScore <= 80)
                        technicalRating = 'Strong';
                    else
                        technicalRating = 'Very Strong';
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
    }
    catch (error) {
        next(error);
    }
});
// Helper to validate parameters using Zod
function validateSymbolParam(req, res, next) {
    const result = analysis_schema_1.SymbolParamSchema.safeParse(req.params);
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
router.get('/:symbol/technical-analysis', validateSymbolParam, async (req, res, next) => {
    const symbol = req.params.symbol;
    try {
        const startTime = Date.now();
        // Try Cache layers
        const cachedResult = await (0, analysisCache_1.getCachedAnalysis)(symbol);
        if (cachedResult) {
            // If cachedResult doesn't have an AI summary, trigger background recalculation to fetch/generate it
            if (!cachedResult.aiSummary) {
                logger_1.logger.info(`Cached result for ${symbol} lacks AI summary. Triggering background recalculation to generate it...`);
                (0, recalculator_1.recalculateAnalysis)(symbol).catch(err => logger_1.logger.error(`Failed async recalculation inside cache hit for ${symbol}`, err));
            }
            const durationMs = Date.now() - startTime;
            logger_1.logger.info(`Served analysis for ${symbol} from cache`, { symbol, durationMs });
            res.json({
                ...cachedResult,
                isCached: true
            });
            return;
        }
        // Cache miss -> Perform Recalculation
        logger_1.logger.info(`Cache miss for ${symbol}. Recalculating analysis...`);
        const freshResult = await (0, recalculator_1.recalculateAnalysis)(symbol);
        const durationMs = Date.now() - startTime;
        logger_1.logger.info(`Served recalculated analysis for ${symbol}`, { symbol, durationMs });
        res.json(freshResult);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/stocks/:symbol/candles
 * Returns historical daily candles for TradingView chart display.
 */
router.get('/:symbol/candles', validateSymbolParam, async (req, res, next) => {
    const symbol = req.params.symbol;
    const limitQuery = req.query.limit ? parseInt(req.query.limit) : 200;
    const fromQuery = req.query.from;
    const toQuery = req.query.to;
    try {
        const whereClause = { symbol };
        if (fromQuery || toQuery) {
            whereClause.date = {};
            if (fromQuery) {
                whereClause.date.gte = new Date(fromQuery);
            }
            if (toQuery) {
                whereClause.date.lte = new Date(toQuery);
            }
        }
        const candles = await prisma_1.default.candle.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/stocks/:symbol/ai-summary
 * Specific endpoint to poll/retrieve the Groq AI summary once generated in the background.
 */
router.get('/:symbol/ai-summary', validateSymbolParam, async (req, res, next) => {
    const symbol = req.params.symbol;
    try {
        // 1. Try to read from Postgres cache first
        const cachedResult = await (0, analysisCache_1.getCachedAnalysis)(symbol);
        if (cachedResult && cachedResult.aiSummary) {
            res.json({
                summary: cachedResult.aiSummary,
                generatedAt: cachedResult.aiGeneratedAt,
                modelUsed: 'llama-3.3-70b-versatile'
            });
            return;
        }
        const lastCandle = await prisma_1.default.candle.findFirst({
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
            report = await AiReport_1.default.findOne({ symbol, candleDate: dateOnly });
        }
        catch (mongoError) {
            logger_1.logger.warn(`MongoDB query failed in /ai-summary route for ${symbol}, proceeding with fallback:`, mongoError);
        }
        if (report) {
            res.json({
                summary: report.summary,
                generatedAt: report.generatedAt.toISOString(),
                modelUsed: report.modelUsed
            });
        }
        else {
            res.json({
                summary: null,
                generatedAt: null
            });
        }
    }
    catch (error) {
        logger_1.logger.error(`Error in /ai-summary route for ${symbol}:`, error);
        // Fallback response instead of 500
        res.json({
            summary: null,
            generatedAt: null
        });
    }
});
exports.default = router;
