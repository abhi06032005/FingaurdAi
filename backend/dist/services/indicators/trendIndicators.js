"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSMA = calculateSMA;
exports.calculateEMA = calculateEMA;
exports.calculateADX = calculateADX;
exports.calculateAllTrendIndicators = calculateAllTrendIndicators;
const technicalindicators_1 = require("technicalindicators");
function calculateSMA(closes, period) {
    if (closes.length < period)
        return null;
    const result = technicalindicators_1.SMA.calculate({ period, values: closes });
    return result.length > 0 ? result[result.length - 1] : null;
}
function calculateEMA(closes, period) {
    if (closes.length < period)
        return null;
    const result = technicalindicators_1.EMA.calculate({ period, values: closes });
    return result.length > 0 ? result[result.length - 1] : null;
}
function calculateADX(highs, lows, closes, period = 14) {
    if (closes.length < period * 2)
        return null;
    try {
        const result = technicalindicators_1.ADX.calculate({
            period,
            high: highs,
            low: lows,
            close: closes
        });
        if (result.length === 0)
            return null;
        const curr = result[result.length - 1];
        if (curr.adx === undefined || curr.pdi === undefined || curr.mdi === undefined) {
            return null;
        }
        return {
            adx: curr.adx,
            plusDI: curr.pdi,
            minusDI: curr.mdi
        };
    }
    catch (error) {
        return null;
    }
}
function calculateAllTrendIndicators(highs, lows, closes) {
    return {
        sma20: calculateSMA(closes, 20),
        sma50: calculateSMA(closes, 50),
        sma200: calculateSMA(closes, 200),
        ema20: calculateEMA(closes, 20),
        ema50: calculateEMA(closes, 50),
        ema200: calculateEMA(closes, 200),
        adx: calculateADX(highs, lows, closes, 14),
    };
}
