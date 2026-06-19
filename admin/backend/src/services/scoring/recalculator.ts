import prisma from '../../config/prisma';
import { calculateAllIndicators } from '../indicators/indicatorOrchestrator';
import { generateSignals } from '../signals/signalEngine';
import { calculateTechnicalScore } from './technicalScorer';
import { calculateConfluence } from './confluenceEngine';
import { recordScoreHistory, getScoreHistory } from './scoreHistoryTracker';
import { getEducationalSummary } from '../ai/groqSummary';
import { setCachedAnalysis, getCachedAnalysis } from '../cache/analysisCache';
import { getStockName } from '../dataIngestion/nifty50Symbols';
import { logger } from '../../utils/logger';
import { formatKolkataDate } from '../../utils/dateUtils';
import AiReport from '../../models/AiReport';
import mongoose from 'mongoose';
mongoose.set('bufferCommands', false);

/**
 * Performs full technical analysis recalculation for a symbol.
 * Loads recent candles, runs indicators, scores strength, generates signals,
 * kicks off background AI summary, updates caches and score history.
 */
export async function recalculateAnalysis(symbol: string, skipAi: boolean = false): Promise<any> {
  const startTime = Date.now();
  logger.info(`Starting technical analysis recalculation for ${symbol}`);

  try {
    // 1. Fetch last 400 daily candles sorted descending (newest first)
    const dbCandles = await prisma.candle.findMany({
      where: {
        symbol,
        dataQuality: { gte: 60 }
      },
      orderBy: { date: 'desc' },
      take: 400
    });

    if (dbCandles.length === 0) {
      throw new Error(`No candles found for symbol: ${symbol}`);
    }

    // Reverse to chronological order (oldest to newest)
    dbCandles.reverse();

    const candlesUsed = dbCandles.length;
    const avgQuality = dbCandles.reduce((sum, c) => sum + c.dataQuality, 0) / candlesUsed;
    
    const formattedCandles = dbCandles.map((c) => ({
      date: c.date,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume),
    }));

    const lastCandle = formattedCandles[formattedCandles.length - 1];
    const currentPrice = lastCandle.close;

    // Calculate daily price change based on second to last close if available
    let priceChange = 0;
    let priceChangePct = 0;
    if (formattedCandles.length >= 2) {
      const prevClose = formattedCandles[formattedCandles.length - 2].close;
      priceChange = currentPrice - prevClose;
      priceChangePct = (priceChange / prevClose) * 100;
    }

    // 2. Run Indicator Orchestration
    const indicators = calculateAllIndicators(formattedCandles);

    // 3. Generate Signals
    const signals = generateSignals(indicators, currentPrice);

    // 4. Calculate Weighted Score & Rating
    const { technicalScore, technicalRating, scoreBreakdown } = calculateTechnicalScore(indicators, currentPrice);

    // 5. Calculate Confluence Score
    const confluenceScore = calculateConfluence(signals);

    // 6. Record Score History in DB (Prisma)
    await recordScoreHistory(symbol, lastCandle.date, technicalScore, technicalRating, confluenceScore);

    // 7. Retrieve last 30 days of Score History
    const historyList = await getScoreHistory(symbol, 30);

    // 8. Fetch/Generate Groq AI Summary
    const dateOnly = new Date(lastCandle.date.toISOString().split('T')[0]);
    let aiSummary: string | null = null;
    let aiGeneratedAt: string | null = null;

    // First try to look up in Postgres cache to see if there is an existing summary for today
    try {
      const existingCache = await prisma.technicalAnalysisCache.findUnique({
        where: { symbol }
      });
      if (existingCache) {
        const result = existingCache.resultJson as any;
        const cacheCandleDateStr = new Date(existingCache.candleDate).toISOString().split('T')[0];
        const currentCandleDateStr = lastCandle.date.toISOString().split('T')[0];
        if (cacheCandleDateStr === currentCandleDateStr && result && result.aiSummary) {
          aiSummary = result.aiSummary;
          aiGeneratedAt = result.aiGeneratedAt;
          logger.info(`Reused AI summary from PostgreSQL cache for ${symbol}`);
        }
      }
    } catch (cacheReadError) {
      logger.error('Failed to read PostgreSQL cache for existing AI summary', cacheReadError);
    }

    // Try MongoDB cache if not found in Postgres cache (wrapped in try-catch to allow failure bypass)
    if (!aiSummary) {
      try {
        const cachedReport = await AiReport.findOne({ symbol, candleDate: dateOnly });
        if (cachedReport) {
          aiSummary = cachedReport.summary;
          aiGeneratedAt = cachedReport.generatedAt.toISOString();
        }
      } catch (mongoError) {
        logger.warn(`Failed querying MongoDB for cached AI report on ${symbol}, proceeding with background generation:`, mongoError);
      }
    }

    // If still null, run in background
    if (!aiSummary && !skipAi) {
      // Run in background
      getEducationalSummary({
        symbol,
        candleDate: lastCandle.date,
        currentPrice,
        indicators
      }).then(async (res) => {
        if (res) {
          logger.info(`Background AI summary generated for ${symbol}`);
          try {
            const currentCache = await getCachedAnalysis(symbol);
            if (currentCache) {
              currentCache.aiSummary = res.summary;
              currentCache.aiGeneratedAt = res.generatedAt.toISOString();
              await setCachedAnalysis(symbol, currentCache, currentCache.technicalScore, lastCandle.date);
              logger.info(`Successfully updated cache with AI summary for ${symbol}`);
            }
          } catch (cacheErr) {
            logger.error(`Failed to update cache with AI summary for ${symbol}`, cacheErr);
          }
        }
      }).catch((err) => {
        logger.error(`Failed background AI summary for ${symbol}`, err);
      });
    }

    // 9. Formulate final API analysis response
    const finalResponse = {
      symbol,
      companyName: getStockName(symbol),
      currentPrice,
      priceChange,
      priceChangePct,
      technicalScore,
      technicalRating,
      confluenceScore,
      scoreBreakdown,
      indicators: {
        rsi: indicators.momentum.rsi?.value ?? null,
        macd: indicators.momentum.macd ? {
          macd: indicators.momentum.macd.macd,
          signal: indicators.momentum.macd.signal,
          histogram: indicators.momentum.macd.histogram,
        } : null,
        stochasticRsi: indicators.momentum.stochasticRsi ? {
          k: indicators.momentum.stochasticRsi.k,
          d: indicators.momentum.stochasticRsi.d,
        } : null,
        sma20: indicators.trend.sma20,
        sma50: indicators.trend.sma50,
        sma200: indicators.trend.sma200,
        ema20: indicators.trend.ema20,
        ema50: indicators.trend.ema50,
        ema200: indicators.trend.ema200,
        bollingerBands: indicators.volatility.bollingerBands ? {
          upper: indicators.volatility.bollingerBands.upper,
          middle: indicators.volatility.bollingerBands.middle,
          lower: indicators.volatility.bollingerBands.lower,
          bandwidth: indicators.volatility.bollingerBands.bandwidth,
          percentB: indicators.volatility.bollingerBands.percentB,
        } : null,
        atr: indicators.volatility.atr,
        adx: indicators.trend.adx ? {
          adx: indicators.trend.adx.adx,
          plusDI: indicators.trend.adx.plusDI,
          minusDI: indicators.trend.adx.minusDI,
        } : null,
        obv: indicators.volume.obv ? {
          obv: indicators.volume.obv.obv,
          slope: indicators.volume.obv.slope,
        } : null,
      },
      signals,
      divergences: indicators.divergences,
      scoreHistory: historyList,
      aiSummary,
      aiGeneratedAt,
      dataQuality: Math.round(avgQuality),
      candlesUsed,
      generatedAt: formatKolkataDate(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
      isCached: false
    };

    // 10. Write to caches
    await setCachedAnalysis(symbol, finalResponse, technicalScore, lastCandle.date);

    const durationMs = Date.now() - startTime;
    logger.info(`Successfully completed recalculation for ${symbol}`, { symbol, durationMs });

    return finalResponse;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Recalculation failed for ${symbol}: ${errMessage}`, { symbol, error });
    throw error;
  }
}
