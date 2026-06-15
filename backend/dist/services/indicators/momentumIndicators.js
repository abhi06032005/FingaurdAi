"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRSI = calculateRSI;
exports.calculateMACD = calculateMACD;
exports.calculateStochasticRSI = calculateStochasticRSI;
exports.calculateAllMomentumIndicators = calculateAllMomentumIndicators;
const technicalindicators_1 = require("technicalindicators");
function calculateRSI(closes, period = 14) {
    if (closes.length <= period)
        return null;
    const result = technicalindicators_1.RSI.calculate({ period, values: closes });
    if (result.length === 0)
        return null;
    const value = result[result.length - 1];
    let slope = 'flat';
    if (result.length >= 5) {
        const diff = result[result.length - 1] - result[result.length - 5];
        if (diff > 0.5) {
            slope = 'rising';
        }
        else if (diff < -0.5) {
            slope = 'falling';
        }
    }
    else if (result.length >= 2) {
        const diff = result[result.length - 1] - result[result.length - 2];
        if (diff > 0.1) {
            slope = 'rising';
        }
        else if (diff < -0.1) {
            slope = 'falling';
        }
    }
    return { value, slope };
}
function calculateMACD(closes) {
    if (closes.length < 35)
        return null;
    const result = technicalindicators_1.MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    });
    if (result.length < 2)
        return null;
    const curr = result[result.length - 1];
    const prev = result[result.length - 2];
    if (curr.MACD === undefined || curr.signal === undefined || curr.histogram === undefined ||
        prev.MACD === undefined || prev.signal === undefined || prev.histogram === undefined) {
        return null;
    }
    let crossoverDetected = false;
    let crossoverDirection = 'none';
    if (prev.histogram <= 0 && curr.histogram > 0) {
        crossoverDetected = true;
        crossoverDirection = 'bullish';
    }
    else if (prev.histogram >= 0 && curr.histogram < 0) {
        crossoverDetected = true;
        crossoverDirection = 'bearish';
    }
    const histogramExpanding = (curr.histogram > 0 && curr.histogram > prev.histogram) ||
        (curr.histogram < 0 && curr.histogram < prev.histogram);
    const histogramContracting = (curr.histogram > 0 && curr.histogram < prev.histogram) ||
        (curr.histogram < 0 && curr.histogram > prev.histogram);
    return {
        macd: curr.MACD,
        signal: curr.signal,
        histogram: curr.histogram,
        crossoverDetected,
        crossoverDirection,
        histogramExpanding,
        histogramContracting,
    };
}
function calculateStochasticRSI(closes) {
    if (closes.length < 34)
        return null;
    const result = technicalindicators_1.StochasticRSI.calculate({
        values: closes,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
    });
    if (result.length < 2)
        return null;
    const curr = result[result.length - 1];
    const prev = result[result.length - 2];
    if (curr.k === undefined || curr.d === undefined || prev.k === undefined || prev.d === undefined) {
        return null;
    }
    let crossover = 'none';
    if (prev.k <= prev.d && curr.k > curr.d) {
        crossover = 'bullish';
    }
    else if (prev.k >= prev.d && curr.k < curr.d) {
        crossover = 'bearish';
    }
    return {
        k: curr.k,
        d: curr.d,
        crossover,
    };
}
function calculateAllMomentumIndicators(closes) {
    return {
        rsi: calculateRSI(closes, 14),
        macd: calculateMACD(closes),
        stochasticRsi: calculateStochasticRSI(closes),
    };
}
