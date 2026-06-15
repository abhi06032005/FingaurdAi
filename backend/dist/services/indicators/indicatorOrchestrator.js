"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAllIndicators = calculateAllIndicators;
const trendIndicators_1 = require("./trendIndicators");
const momentumIndicators_1 = require("./momentumIndicators");
const volatilityIndicators_1 = require("./volatilityIndicators");
const volumeIndicators_1 = require("./volumeIndicators");
const divergenceDetector_1 = require("./divergenceDetector");
const technicalindicators_1 = require("technicalindicators");
/**
 * Orchestrates the calculations of all indicators.
 * @param candles List of candles, sorted chronologically (oldest to newest).
 */
function calculateAllIndicators(candles) {
    const closes = candles.map(c => Number(c.close));
    const highs = candles.map(c => Number(c.high));
    const lows = candles.map(c => Number(c.low));
    const volumes = candles.map(c => Number(c.volume));
    // Run the indicator calculators
    const trend = (0, trendIndicators_1.calculateAllTrendIndicators)(highs, lows, closes);
    const momentum = (0, momentumIndicators_1.calculateAllMomentumIndicators)(closes);
    const volatility = (0, volatilityIndicators_1.calculateAllVolatilityIndicators)(highs, lows, closes);
    const volume = (0, volumeIndicators_1.calculateAllVolumeIndicators)(closes, volumes);
    // For divergence detector, we need historical arrays of RSI and MACD Histogram.
    let divergences = [];
    if (closes.length >= 14) {
        const fullRsi = technicalindicators_1.RSI.calculate({ period: 14, values: closes });
        const macdCalc = technicalindicators_1.MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });
        const fullMacdHist = macdCalc.map(m => m.histogram ?? 0);
        divergences = (0, divergenceDetector_1.detectDivergences)(closes, fullRsi, fullMacdHist, 14);
    }
    return {
        trend,
        momentum,
        volatility,
        volume,
        divergences
    };
}
