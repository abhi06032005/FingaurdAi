"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const analysis_schema_1 = require("../schemas/analysis.schema");
const indicators_1 = require("../lib/analysis/indicators");
const quantModels_1 = require("../lib/analysis/quantModels");
const intelligenceLayers_1 = require("../lib/analysis/intelligenceLayers");
const groqSummary_1 = require("../lib/analysis/groqSummary");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// In-memory cache: symbol -> { asOf: string, data: any }
const analysisCache = {};
router.get('/:ticker', async (req, res, next) => {
    let ticker = req.params.ticker;
    if (!ticker) {
        return res.status(400).json({ success: false, error: 'Ticker is required' });
    }
    ticker = ticker.toUpperCase().trim();
    let symbol = ticker;
    if (!symbol.endsWith('.NS')) {
        symbol = symbol + '.NS';
    }
    // Validate if NIFTY 50 symbol
    const isValidSymbol = analysis_schema_1.NIFTY_50_SYMBOLS.includes(symbol);
    if (!isValidSymbol) {
        return res.status(400).json({
            success: false,
            error: `Symbol ${symbol} is not a valid NIFTY 50 stock symbol.`
        });
    }
    try {
        const startTime = Date.now();
        // 1. Fetch latest candle date to verify cache fresh state
        const latestCandleDateRecord = await prisma_1.default.candle.findFirst({
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
            logger_1.logger.info(`Served technical analysis for ${symbol} from memory cache as of ${latestDateStr}`);
            return res.status(200).json(analysisCache[symbol].data);
        }
        // 3. Cache Miss -> Fetch last 300 daily candles (300 needed for valid SMA-200)
        const candles = await prisma_1.default.candle.findMany({
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
        const peersCandles = await prisma_1.default.candle.findMany({
            where: {
                symbol: { in: analysis_schema_1.NIFTY_50_SYMBOLS }
            },
            orderBy: { date: 'asc' },
            select: { symbol: true, close: true, date: true, volume: true }
        });
        // Group candles by symbol
        const allGroupedCandles = {};
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
        const sma20 = (0, indicators_1.computeSMA)(closes, 20);
        const sma50 = (0, indicators_1.computeSMA)(closes, 50);
        const sma200 = (0, indicators_1.computeSMA)(closes, 200);
        const ema9 = (0, indicators_1.computeEMA)(closes, 9);
        const ema21 = (0, indicators_1.computeEMA)(closes, 21);
        const ema55 = (0, indicators_1.computeEMA)(closes, 55);
        const macdData = (0, indicators_1.computeMACD)(closes, 12, 26, 9);
        const rsi = (0, indicators_1.computeRSI)(closes, 14);
        const bb = (0, indicators_1.computeBollingerBands)(closes, 20, 2);
        const atr = (0, indicators_1.computeATR)(highs, lows, closes, 14);
        const stochastic = (0, indicators_1.computeStochastic)(highs, lows, closes, 14, 3);
        const williamsR = (0, indicators_1.computeWilliamsR)(highs, lows, closes, 14);
        const cci = (0, indicators_1.computeCCI)(highs, lows, closes, 20);
        const obv = (0, indicators_1.computeOBV)(closes, volumes);
        // Volume SMA 20 and Volume Ratio
        const volSma20 = (0, indicators_1.computeSMA)(volumes, 20);
        const currentVol = volumes[latestIdx];
        const avgVol20 = volSma20[latestIdx] || 1;
        const volumeRatio = currentVol / avgVol20;
        const adxData = (0, indicators_1.computeADX)(highs, lows, closes, 14);
        const vwapData = (0, indicators_1.computeVWAP)(highs, lows, closes, volumes, 20);
        // Quant Models
        const hurstExponent = (0, quantModels_1.calculateHurstExponent)(closes);
        const efficiencyRatio = (0, quantModels_1.calculateEfficiencyRatio)(closes, 20);
        const zScore = (0, quantModels_1.calculateZScore)(closes, 20);
        const realizedVolatility = (0, quantModels_1.calculateRealizedVolatility)(closes, 20);
        const autocorrelation = (0, quantModels_1.calculateAutocorrelation)(closes);
        const drawdown = (0, quantModels_1.calculateDrawdown)(closes);
        const returnStats = (0, quantModels_1.calculateReturnStats)(closes);
        const percentileRank = (0, quantModels_1.calculatePricePercentileRank)(closes);
        const volumeProfile = (0, quantModels_1.calculateVolumeProfile)(closes, volumes);
        const ichimoku = (0, quantModels_1.computeIchimoku)(highs, lows, closes);
        // Pivots: map database objects to match input signature
        const pivotInputs = candles.map(c => ({
            date: c.date,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
        }));
        const pivots = (0, quantModels_1.calculatePivots)(pivotInputs);
        // Confluence Score
        const confluenceScore = (0, quantModels_1.calculateConfluence)(closes, highs, lows, volumes);
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
        const upgraded = (0, intelligenceLayers_1.calculateUpgradedAnalytics)(upgradedInput);
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
        const aiSummary = await (0, groqSummary_1.generateGroqSummary)(aiSummaryInput);
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
        logger_1.logger.info(`Successfully completed technical analysis for ${symbol} in ${durationMs}ms`);
        return res.status(200).json(responseData);
    }
    catch (error) {
        logger_1.logger.error(`Error calculating technical analysis for ${symbol}:`, error);
        next(error);
    }
});
exports.default = router;
