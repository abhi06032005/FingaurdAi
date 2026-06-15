"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBollingerBands = calculateBollingerBands;
exports.calculateATR = calculateATR;
exports.calculateAllVolatilityIndicators = calculateAllVolatilityIndicators;
const technicalindicators_1 = require("technicalindicators");
function calculateBollingerBands(closes, period = 20, stdDev = 2) {
    if (closes.length < period)
        return null;
    const result = technicalindicators_1.BollingerBands.calculate({
        period,
        values: closes,
        stdDev
    });
    if (result.length < 2) {
        if (result.length === 1) {
            const curr = result[0];
            const lastClose = closes[closes.length - 1];
            if (curr.upper === undefined || curr.middle === undefined || curr.lower === undefined)
                return null;
            const denominator = curr.upper - curr.lower;
            const percentB = denominator !== 0 ? (lastClose - curr.lower) / denominator : 0.5;
            const bandwidth = curr.middle !== 0 ? (curr.upper - curr.lower) / curr.middle : 0;
            return {
                upper: curr.upper,
                middle: curr.middle,
                lower: curr.lower,
                bandwidth,
                percentB,
                bandwidthState: 'flat'
            };
        }
        return null;
    }
    const curr = result[result.length - 1];
    const prev = result[result.length - 2];
    const lastClose = closes[closes.length - 1];
    if (curr.upper === undefined || curr.middle === undefined || curr.lower === undefined ||
        prev.upper === undefined || prev.middle === undefined || prev.lower === undefined) {
        return null;
    }
    const denominator = curr.upper - curr.lower;
    const percentB = denominator !== 0 ? (lastClose - curr.lower) / denominator : 0.5;
    const bandwidth = curr.middle !== 0 ? (curr.upper - curr.lower) / curr.middle : 0;
    const prevBandwidth = prev.middle !== 0 ? (prev.upper - prev.lower) / prev.middle : 0;
    const diff = bandwidth - prevBandwidth;
    const threshold = prevBandwidth * 0.002; // 0.2% change tolerance
    let bandwidthState = 'flat';
    if (diff < -threshold) {
        bandwidthState = 'contracting';
    }
    else if (diff > threshold) {
        bandwidthState = 'expanding';
    }
    return {
        upper: curr.upper,
        middle: curr.middle,
        lower: curr.lower,
        bandwidth,
        percentB,
        bandwidthState
    };
}
function calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period || lows.length < period || closes.length < period) {
        return null;
    }
    const result = technicalindicators_1.ATR.calculate({
        period,
        high: highs,
        low: lows,
        close: closes
    });
    return result.length > 0 ? result[result.length - 1] : null;
}
function calculateAllVolatilityIndicators(highs, lows, closes) {
    return {
        bollingerBands: calculateBollingerBands(closes, 20, 2),
        atr: calculateATR(highs, lows, closes, 14),
    };
}
