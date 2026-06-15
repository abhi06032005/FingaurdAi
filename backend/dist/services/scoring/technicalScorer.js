"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTechnicalScore = calculateTechnicalScore;
const mathUtils_1 = require("../../utils/mathUtils");
/**
 * Calculates the Technical Strength Score (0-100) and Rating.
 * Strict rules: No recommendations or forbidden vocabulary.
 */
function calculateTechnicalScore(indicators, currentPrice) {
    const breakdown = {
        RSI: 10, // Default neutral (max 20)
        MACD: 10, // Default neutral (max 20)
        MOVING_AVERAGES: 10, // Default neutral (max 20)
        ADX: 7.5, // Default neutral (max 15)
        BOLLINGER: 5, // Default neutral (max 10)
        STOCH_RSI: 5, // Default neutral (max 10)
        OBV: 2.5, // Default neutral (max 5)
    };
    // 1. RSI (20 pts)
    const rsi = indicators.momentum.rsi;
    if (rsi !== null) {
        const val = rsi.value;
        if (val >= 45 && val <= 55 && rsi.slope === 'rising') {
            breakdown.RSI = 16;
        }
        else if (val >= 40 && val <= 60) {
            breakdown.RSI = 10;
        }
        else if ((val >= 30 && val < 40) || (val > 60 && val <= 70)) {
            breakdown.RSI = 13;
        }
        else if (val < 30) {
            breakdown.RSI = 8;
        }
        else if (val > 70) {
            breakdown.RSI = 8;
        }
    }
    // 2. MACD (20 pts)
    const macd = indicators.momentum.macd;
    if (macd !== null) {
        if (macd.crossoverDetected) {
            if (macd.crossoverDirection === 'bullish') {
                breakdown.MACD = macd.histogramExpanding ? 20 : 14;
            }
            else if (macd.crossoverDirection === 'bearish') {
                breakdown.MACD = macd.histogramExpanding ? 4 : 8;
            }
        }
        else if (macd.histogramExpanding) {
            breakdown.MACD = macd.histogram > 0 ? 17 : 6;
        }
        else if (macd.histogramContracting) {
            breakdown.MACD = 10;
        }
        else {
            breakdown.MACD = 10;
        }
    }
    // 3. Moving Averages Stack (20 pts — 5 pts each)
    const trend = indicators.trend;
    let maScore = 0;
    let maCount = 0;
    if (trend.sma50 !== null) {
        maCount++;
        if (currentPrice > trend.sma50)
            maScore += 5;
    }
    if (trend.sma200 !== null) {
        maCount++;
        if (currentPrice > trend.sma200)
            maScore += 5;
    }
    if (trend.ema50 !== null) {
        maCount++;
        if (currentPrice > trend.ema50)
            maScore += 5;
    }
    if (trend.ema200 !== null) {
        maCount++;
        if (currentPrice > trend.ema200)
            maScore += 5;
    }
    if (maCount > 0) {
        breakdown.MOVING_AVERAGES = (maScore / (maCount * 5)) * 20;
    }
    // 4. ADX (15 pts)
    const adx = indicators.trend.adx;
    if (adx !== null) {
        if (adx.adx > 40 && adx.plusDI > adx.minusDI) {
            breakdown.ADX = 15;
        }
        else if (adx.adx > 25 && adx.plusDI > adx.minusDI) {
            breakdown.ADX = 11;
        }
        else if (adx.adx > 25 && adx.minusDI > adx.plusDI) {
            breakdown.ADX = 4;
        }
        else if (adx.adx > 40 && adx.minusDI > adx.plusDI) {
            breakdown.ADX = 2;
        }
        else if (adx.adx < 20) {
            breakdown.ADX = 7;
        }
        else {
            breakdown.ADX = 8;
        }
    }
    // 5. Bollinger Bands %B (10 pts)
    const bb = indicators.volatility.bollingerBands;
    if (bb !== null) {
        const pctB = bb.percentB;
        if (pctB >= 0.4 && pctB <= 0.6) {
            breakdown.BOLLINGER = 8;
        }
        else if (pctB > 0.6 && pctB <= 0.8) {
            breakdown.BOLLINGER = 10;
        }
        else if (pctB > 0.8) {
            breakdown.BOLLINGER = 5;
        }
        else if (pctB >= 0.2 && pctB < 0.4) {
            breakdown.BOLLINGER = 6;
        }
        else if (pctB < 0.2) {
            breakdown.BOLLINGER = 4;
        }
    }
    // 6. Stochastic RSI (10 pts)
    const stoch = indicators.momentum.stochasticRsi;
    if (stoch !== null) {
        const k = stoch.k;
        const d = stoch.d;
        if (k > d && k < 80) {
            breakdown.STOCH_RSI = 9;
        }
        else if (k > d && k >= 80) {
            breakdown.STOCH_RSI = 5;
        }
        else if (k < d && k > 20) {
            breakdown.STOCH_RSI = 5;
        }
        else if (k < d && k <= 20) {
            breakdown.STOCH_RSI = 7;
        }
    }
    // 7. OBV Slope (5 pts)
    const obv = indicators.volume.obv;
    if (obv !== null) {
        if (obv.slope === 'rising') {
            breakdown.OBV = 5;
        }
        else if (obv.slope === 'falling') {
            breakdown.OBV = 1;
        }
        else {
            breakdown.OBV = 3;
        }
    }
    // Sum components to get total score
    const totalScore = breakdown.RSI + breakdown.MACD + breakdown.MOVING_AVERAGES +
        breakdown.ADX + breakdown.BOLLINGER + breakdown.STOCH_RSI + breakdown.OBV;
    const finalScore = (0, mathUtils_1.round)(Math.max(0, Math.min(100, totalScore)), 1);
    // Map to Rating
    let rating = 'Neutral';
    if (finalScore <= 20) {
        rating = 'Very Weak';
    }
    else if (finalScore <= 40) {
        rating = 'Weak';
    }
    else if (finalScore <= 60) {
        rating = 'Neutral';
    }
    else if (finalScore <= 80) {
        rating = 'Strong';
    }
    else {
        rating = 'Very Strong';
    }
    return {
        technicalScore: finalScore,
        technicalRating: rating,
        scoreBreakdown: breakdown,
    };
}
