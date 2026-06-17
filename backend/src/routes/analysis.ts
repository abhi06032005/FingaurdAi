import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { NIFTY_50_SYMBOLS } from '../schemas/analysis.schema';
import {
  computeSMA,
  computeEMA,
  computeMACD,
  computeRSI,
  computeBollingerBands,
  computeATR,
  computeStochastic,
  computeWilliamsR,
  computeCCI,
  computeOBV,
  computeADX,
  computeVWAP
} from '../lib/analysis/indicators';
import {
  calculateHurstExponent,
  calculateEfficiencyRatio,
  calculateZScore,
  calculateRealizedVolatility,
  calculateAutocorrelation,
  calculateDrawdown,
  calculateReturnStats,
  calculatePricePercentileRank,
  calculateVolumeProfile,
  computeIchimoku,
  calculatePivots,
  calculateConfluence
} from '../lib/analysis/quantModels';
import { calculateUpgradedAnalytics } from '../lib/analysis/intelligenceLayers';
import { generateGroqSummary } from '../lib/analysis/groqSummary';
import { logger } from '../utils/logger';

const router = Router();

// In-memory cache: symbol -> { asOf: string, data: any }
const analysisCache: Record<string, { asOf: string; data: any }> = {};

router.get('/:ticker', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  let ticker = req.params.ticker as string;
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'Ticker is required' });
  }

  ticker = ticker.toUpperCase().trim();
  let symbol = ticker;
  if (!symbol.endsWith('.NS')) {
    symbol = symbol + '.NS';
  }

  // Validate if NIFTY 50 symbol
  const isValidSymbol = (NIFTY_50_SYMBOLS as readonly string[]).includes(symbol);
  if (!isValidSymbol) {
    return res.status(400).json({
      success: false,
      error: `Symbol ${symbol} is not a valid NIFTY 50 stock symbol.`
    });
  }

  try {
    const startTime = Date.now();

    // 1. Fetch latest candle date to verify cache fresh state
    const latestCandleDateRecord = await prisma.candle.findFirst({
      where: { symbol },
      orderBy: { date: 'desc' },
      select: { date: true }
    });

    if (!latestCandleDateRecord) {
      return res.status(404).json({
        success: false,
        error: `No candle data found in Neon DB for symbol: ${symbol}`
      });
    }

    const latestDateStr = latestCandleDateRecord.date.toISOString().split('T')[0];

    // 2. Check Cache
    if (analysisCache[symbol] && analysisCache[symbol].asOf === latestDateStr) {
      logger.info(`Served technical analysis for ${symbol} from memory cache as of ${latestDateStr}`);
      return res.status(200).json(analysisCache[symbol].data);
    }

    // 3. Cache Miss -> Fetch last 300 daily candles (300 needed for valid SMA-200)
    const candles = await prisma.candle.findMany({
      where: { symbol },
      orderBy: { date: 'desc' },
      take: 300
    });

    if (candles.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No historical candles found in Neon DB for symbol: ${symbol}`
      });
    }

    // Fetch last 150 days of candles for ALL Nifty 50 stocks to compute relative strength
    const peersCandles = await prisma.candle.findMany({
      where: {
        symbol: { in: NIFTY_50_SYMBOLS as any }
      },
      orderBy: { date: 'asc' },
      select: { symbol: true, close: true, date: true, volume: true }
    });

    // Group candles by symbol
    const allGroupedCandles: Record<string, { close: number; date: Date; volume: number }[]> = {};
    for (const c of peersCandles) {
      if (!allGroupedCandles[c.symbol]) {
        allGroupedCandles[c.symbol] = [];
      }
      allGroupedCandles[c.symbol].push({
        close: Number(c.close),
        date: c.date,
        volume: Number(c.volume)
      });
    }
    
    // Trim each symbol's candles to keep at most the last 300
    for (const sym of Object.keys(allGroupedCandles)) {
      if (allGroupedCandles[sym].length > 300) {
        allGroupedCandles[sym] = allGroupedCandles[sym].slice(allGroupedCandles[sym].length - 300);
      }
    }

    // Reverse to chronological order (oldest to newest)
    candles.reverse();
    const dataWindowDays = candles.length;

    // Map fields to numbers
    const dates = candles.map(c => c.date);
    const closes = candles.map(c => Number(c.close));
    const highs = candles.map(c => Number(c.high));
    const lows = candles.map(c => Number(c.low));
    const opens = candles.map(c => Number(c.open));
    const volumes = candles.map(c => Number(c.volume));

    const latestIdx = closes.length - 1;
    const currentPrice = closes[latestIdx];

    // Compute Indicators
    const sma20 = computeSMA(closes, 20);
    const sma50 = computeSMA(closes, 50);
    const sma200 = computeSMA(closes, 200);
    const ema9 = computeEMA(closes, 9);
    const ema21 = computeEMA(closes, 21);
    const ema55 = computeEMA(closes, 55);

    const macdData = computeMACD(closes, 12, 26, 9);
    const rsi = computeRSI(closes, 14);
    const bb = computeBollingerBands(closes, 20, 2);
    const atr = computeATR(highs, lows, closes, 14);
    const stochastic = computeStochastic(highs, lows, closes, 14, 3);
    const williamsR = computeWilliamsR(highs, lows, closes, 14);
    const cci = computeCCI(highs, lows, closes, 20);
    const obv = computeOBV(closes, volumes);
    
    // Volume SMA 20 and Volume Ratio
    const volSma20 = computeSMA(volumes, 20);
    const currentVol = volumes[latestIdx];
    const avgVol20 = volSma20[latestIdx] || 1;
    const volumeRatio = currentVol / avgVol20;

    const adxData = computeADX(highs, lows, closes, 14);
    const vwapData = computeVWAP(highs, lows, closes, volumes, 20);

    // Quant Models
    const hurstExponent = calculateHurstExponent(closes);
    const efficiencyRatio = calculateEfficiencyRatio(closes, 20);
    const zScore = calculateZScore(closes, 20);
    const realizedVolatility = calculateRealizedVolatility(closes, 20);
    const autocorrelation = calculateAutocorrelation(closes);
    const drawdown = calculateDrawdown(closes);
    const returnStats = calculateReturnStats(closes);
    const percentileRank = calculatePricePercentileRank(closes);
    const volumeProfile = calculateVolumeProfile(closes, volumes);
    const ichimoku = computeIchimoku(highs, lows, closes);
    
    // Pivots: map database objects to match input signature
    const pivotInputs = candles.map(c => ({
      date: c.date,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close)
    }));
    const pivots = calculatePivots(pivotInputs);

    // Confluence Score
    const confluenceScore = calculateConfluence(closes, highs, lows, volumes);

    // Upgraded Intelligence Layers
    const upgradedInput = {
      ticker: symbol,
      closes,
      highs,
      lows,
      volumes,
      dates,
      rsi,
      macdHistogram: macdData.histogram,
      adx: adxData.adx,
      atr,
      hurstExponent,
      efficiencyRatio,
      realizedVolatility,
      drawdown,
      zScore,
      percentileRank,
      volumeRatio,
      confluenceScore,
      pivots,
      allGroupedCandles
    };

    const upgraded = calculateUpgradedAnalytics(upgradedInput);

    // AI Summary upgraded inputs
    const prevMacdHist = macdData.histogram[latestIdx - 1] || macdData.histogram[latestIdx] || 0;
    const largestConfContributor = Object.entries(upgraded.indicatorAttribution)
      .map(([k, v]) => ({ name: k, val: v }))
      .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))[0]?.name || 'trend';

    // Compute OBV slope for AI context
    const obvArr = obv;
    const obvSlope = obvArr[latestIdx] > (obvArr[Math.max(0, latestIdx - 5)] || 0) ? 'rising' : 'falling';
    const vwapDistPct = vwapData.vwap[latestIdx] ? ((currentPrice - vwapData.vwap[latestIdx]) / vwapData.vwap[latestIdx]) * 100 : 0;

    const aiSummaryInput = {
      ticker: symbol,
      rsi: isNaN(rsi[latestIdx]) ? 50 : rsi[latestIdx],
      macdHistogram: macdData.histogram[latestIdx] || 0,
      prevMacdHistogram: prevMacdHist,
      pricePercentB: isNaN(bb.percentB[latestIdx]) ? 0.5 : bb.percentB[latestIdx],
      adx: adxData.adx[latestIdx] || 0,
      hurstExponent,
      efficiencyRatio,
      realizedVolatility,
      percentileRank,
      currentDrawdown: drawdown.currentDrawdown,
      sharpeRatio: returnStats.sharpeRatio,
      compositeConfluence: upgraded.compositeConfluence,
      marketStructure: upgraded.regimeDetection.currentRegime,
      largestContributor: largestConfContributor,
      relativeStrength5d: upgraded.relativeStrength.performance[5],
      relativeStrength20d: upgraded.relativeStrength.performance[20],
      confidenceScore: upgraded.confidenceScore.score,
      // New narrative context fields
      volumeRatio,
      vwapDistancePct: vwapDistPct,
      obvSlope,
      dRsi: upgraded.dailyDelta.deltas.rsi,
      dVol: upgraded.dailyDelta.deltas.volatility,
      dVolumeRatio: upgraded.dailyDelta.deltas.volumeRatio
    };

    const aiSummary = await generateGroqSummary(aiSummaryInput);

    // Build the final response JSON
    const responseData = {
      ticker: symbol,
      asOf: latestDateStr,
      dataWindowDays,
      priceSnapshot: {
        close: currentPrice,
        percentileRank,
        zScore,
        vwap: vwapData.vwap[latestIdx] || currentPrice,
        vwapDeviation: vwapData.vwapDeviation[latestIdx] || 0
      },
      classicIndicators: {
        sma: {
          sma20: sma20[latestIdx] || currentPrice,
          sma50: sma50[latestIdx] || currentPrice,
          sma200: sma200[latestIdx] || currentPrice
        },
        ema: {
          ema9: ema9[latestIdx] || currentPrice,
          ema21: ema21[latestIdx] || currentPrice,
          ema55: ema55[latestIdx] || currentPrice
        },
        macd: {
          line: macdData.macd[latestIdx] || 0,
          signal: macdData.signal[latestIdx] || 0,
          histogram: macdData.histogram[latestIdx] || 0
        },
        rsi: isNaN(rsi[latestIdx]) ? 50 : rsi[latestIdx],
        bb: {
          upper: isNaN(bb.upper[latestIdx]) ? currentPrice : bb.upper[latestIdx],
          mid: isNaN(bb.mid[latestIdx]) ? currentPrice : bb.mid[latestIdx],
          lower: isNaN(bb.lower[latestIdx]) ? currentPrice : bb.lower[latestIdx],
          percentB: isNaN(bb.percentB[latestIdx]) ? 0.5 : bb.percentB[latestIdx],
          bandwidth: isNaN(bb.bandwidth[latestIdx]) ? 0 : bb.bandwidth[latestIdx]
        },
        atr: atr[latestIdx] || 0,
        obv: obv[latestIdx] || 0,
        obvSlope: obvArr[latestIdx] > (obvArr[Math.max(0, latestIdx - 5)] || 0) ? 'rising' : 'falling',
        volumeRatio,
        vwap: vwapData.vwap[latestIdx] || currentPrice,
        vwapDistancePct: vwapDistPct,
        adx: {
          adx: adxData.adx[latestIdx] || 0,
          plusDI: adxData.plusDI[latestIdx] || 0,
          minusDI: adxData.minusDI[latestIdx] || 0
        }
      },
      quantModels: {
        hurstExponent,
        efficiencyRatio,
        realizedVolatility,
        autocorrelation: {
          lag1: autocorrelation[1] || 0,
          lag2: autocorrelation[2] || 0,
          lag3: autocorrelation[3] || 0,
          lag5: autocorrelation[5] || 0,
          lag10: autocorrelation[10] || 0
        },
        drawdown: {
          maxDrawdown: drawdown.maxDrawdown,
          currentDrawdown: drawdown.currentDrawdown,
          durationDays: drawdown.durationDays,
          underwaterCurve: drawdown.underwaterCurve
        },
        returnStats: {
          annualizedReturn: returnStats.annualizedReturn,
          annualizedVolatility: returnStats.annualizedVolatility,
          sharpeRatio: returnStats.sharpeRatio,
          sortinoRatio: returnStats.sortinoRatio,
          skewness: returnStats.skewness,
          kurtosis: returnStats.kurtosis
        },
        volumeProfile,
        ichimoku: {
          tenkan: ichimoku.tenkan[latestIdx] || currentPrice,
          kijun: ichimoku.kijun[latestIdx] || currentPrice,
          senkouA: ichimoku.senkouA[latestIdx] || currentPrice,
          senkouB: ichimoku.senkouB[latestIdx] || currentPrice,
          chikou: ichimoku.chikou[latestIdx] || currentPrice,
          position: ichimoku.position
        },
        pivots
      },
      confluenceScore: {
        trend: confluenceScore.trend,
        momentum: confluenceScore.momentum,
        volatility: confluenceScore.volatility,
        volume: confluenceScore.volume,
        composite: upgraded.compositeConfluence
      },
      // Advanced intelligence layers
      historicalAnalogs: upgraded.historicalAnalogs,
      indicatorAttribution: upgraded.indicatorAttribution,
      regimeDetection: upgraded.regimeDetection,
      dailyDelta: upgraded.dailyDelta,
      confidenceScore: upgraded.confidenceScore,
      relativeStrength: upgraded.relativeStrength,
      marketDNA: upgraded.marketDNA,
      modelAgreement: upgraded.modelAgreement,
      modelReliability: upgraded.modelReliability,
      priceBehaviour: upgraded.priceBehaviour,
      volumeBehaviour: upgraded.volumeBehaviour,
      aiSummary
    };

    // Cache results
    analysisCache[symbol] = {
      asOf: latestDateStr,
      data: responseData
    };

    const durationMs = Date.now() - startTime;
    logger.info(`Successfully completed technical analysis for ${symbol} in ${durationMs}ms`);

    return res.status(200).json(responseData);
  } catch (error) {
    logger.error(`Error calculating technical analysis for ${symbol}:`, error);
    next(error);
  }
});

export default router;
