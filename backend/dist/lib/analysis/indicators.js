"use strict";
/**
 * Core technical indicator calculations.
 * All functions return properly initialized arrays aligned to input length.
 *
 * Warm-up policy:
 *   - SMA: returns NaN for indices where window < period
 *   - EMA: seeds from values[0] (acceptable bias for daily data)
 *   - RSI: returns 50 (neutral) for warmup bars, then Wilder-smoothed values
 *   - OBV: initializes to 0 (not volumes[0]) so slope is meaningful
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSMA = computeSMA;
exports.computeEMA = computeEMA;
exports.computeRSI = computeRSI;
exports.computeBollingerBands = computeBollingerBands;
exports.computeATR = computeATR;
exports.computeStochastic = computeStochastic;
exports.computeWilliamsR = computeWilliamsR;
exports.computeCCI = computeCCI;
exports.computeOBV = computeOBV;
exports.computeADX = computeADX;
exports.computeVWAP = computeVWAP;
exports.safeAt = safeAt;
exports.computeMACD = computeMACD;
function computeSMA(values, period) {
    const sma = [];
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
        }
        else {
            const window = values.slice(i - period + 1, i + 1);
            const avg = window.reduce((a, b) => a + b, 0) / period;
            sma.push(avg);
        }
    }
    return sma;
}
function computeEMA(values, period) {
    const ema = [];
    if (values.length === 0)
        return [];
    const k = 2 / (period + 1);
    // Seed with SMA of first `period` values for better accuracy
    if (values.length < period) {
        // Not enough data — return NaN-filled array
        return values.map(() => NaN);
    }
    let prevEma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    // Fill warmup indices with NaN
    for (let i = 0; i < period - 1; i++) {
        ema.push(NaN);
    }
    ema.push(prevEma);
    for (let i = period; i < values.length; i++) {
        const curEma = values[i] * k + prevEma * (1 - k);
        ema.push(curEma);
        prevEma = curEma;
    }
    return ema;
}
/**
 * Wilder-smoothed RSI.
 * Returns 50 (neutral) for warmup bars (idx < period).
 * This is intentional — callers use [latestIdx] which is always past warmup.
 */
function computeRSI(closes, period = 14) {
    const rsi = [];
    if (closes.length === 0)
        return [];
    let avgGain = 0;
    let avgLoss = 0;
    // Fill warmup bars with NaN
    for (let i = 0; i < period; i++) {
        rsi.push(NaN);
    }
    // First RS calculation: simple average of first `period` gains/losses
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        avgGain += diff > 0 ? diff : 0;
        avgLoss += diff < 0 ? -diff : 0;
    }
    avgGain /= period;
    avgLoss /= period;
    const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs0));
    // Wilder smoothing for remaining bars
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
    }
    return rsi;
}
function computeBollingerBands(closes, period = 20, stdDevMultiplier = 2) {
    const upper = [];
    const mid = [];
    const lower = [];
    const percentB = [];
    const bandwidth = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            upper.push(NaN);
            mid.push(NaN);
            lower.push(NaN);
            percentB.push(NaN);
            bandwidth.push(NaN);
            continue;
        }
        const window = closes.slice(i - period + 1, i + 1);
        const mean = window.reduce((a, b) => a + b, 0) / period;
        const variance = window.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        const u = mean + stdDevMultiplier * std;
        const l = mean - stdDevMultiplier * std;
        upper.push(u);
        mid.push(mean);
        lower.push(l);
        percentB.push((u - l) === 0 ? 0.5 : (closes[i] - l) / (u - l));
        bandwidth.push(mean === 0 ? 0 : (u - l) / mean);
    }
    return { upper, mid, lower, percentB, bandwidth };
}
function computeATR(highs, lows, closes, period = 14) {
    const atr = [];
    if (closes.length === 0)
        return [];
    const tr = [];
    tr.push(highs[0] - lows[0]);
    for (let i = 1; i < closes.length; i++) {
        const h_l = highs[i] - lows[i];
        const h_pc = Math.abs(highs[i] - closes[i - 1]);
        const l_pc = Math.abs(lows[i] - closes[i - 1]);
        tr.push(Math.max(h_l, h_pc, l_pc));
    }
    // Wilder smoothing for ATR
    let currentAtr = tr.slice(0, period).reduce((a, b) => a + b, 0) / Math.min(period, tr.length);
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            const avg = tr.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1);
            atr.push(avg);
        }
        else if (i === period - 1) {
            atr.push(currentAtr);
        }
        else {
            currentAtr = (currentAtr * (period - 1) + tr[i]) / period;
            atr.push(currentAtr);
        }
    }
    return atr;
}
function computeStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    const k = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < kPeriod - 1) {
            k.push(NaN);
            continue;
        }
        const start = i - kPeriod + 1;
        const windowHighs = highs.slice(start, i + 1);
        const windowLows = lows.slice(start, i + 1);
        const highestHigh = Math.max(...windowHighs);
        const lowestLow = Math.min(...windowLows);
        const range = highestHigh - lowestLow;
        const val = range === 0 ? 50 : 100 * (closes[i] - lowestLow) / range;
        k.push(val);
    }
    const d = computeSMA(k.map(v => isNaN(v) ? 0 : v), dPeriod);
    return { k, d };
}
function computeWilliamsR(highs, lows, closes, period = 14) {
    const wR = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            wR.push(NaN);
            continue;
        }
        const start = i - period + 1;
        const windowHighs = highs.slice(start, i + 1);
        const windowLows = lows.slice(start, i + 1);
        const highestHigh = Math.max(...windowHighs);
        const lowestLow = Math.min(...windowLows);
        const range = highestHigh - lowestLow;
        const val = range === 0 ? -50 : -100 * (highestHigh - closes[i]) / range;
        wR.push(val);
    }
    return wR;
}
function computeCCI(highs, lows, closes, period = 20) {
    const cci = [];
    const tp = [];
    for (let i = 0; i < closes.length; i++) {
        tp.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    const smaTp = computeSMA(tp, period);
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            cci.push(NaN);
            continue;
        }
        const start = i - period + 1;
        const windowTp = tp.slice(start, i + 1);
        const meanTp = smaTp[i];
        const meanDev = windowTp.reduce((sum, v) => sum + Math.abs(v - meanTp), 0) / windowTp.length;
        const currentCCI = meanDev === 0 ? 0 : (tp[i] - meanTp) / (0.015 * meanDev);
        cci.push(currentCCI);
    }
    return cci;
}
/**
 * On-Balance Volume.
 * Initialized to 0 (not volumes[0]) so the slope is the only meaningful metric.
 * The absolute OBV level is arbitrary and should not be compared across stocks.
 */
function computeOBV(closes, volumes) {
    const obv = [];
    if (closes.length === 0)
        return [];
    let currentObv = 0; // Fixed: was volumes[0] which made level meaningless
    obv.push(currentObv);
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i - 1]) {
            currentObv += volumes[i];
        }
        else if (closes[i] < closes[i - 1]) {
            currentObv -= volumes[i];
        }
        obv.push(currentObv);
    }
    return obv;
}
function computeADX(highs, lows, closes, period = 14) {
    const plusDI = [];
    const minusDI = [];
    const adx = [];
    if (closes.length === 0)
        return { plusDI: [], minusDI: [], adx: [] };
    const tr = [];
    const plusDM = [];
    const minusDM = [];
    tr.push(highs[0] - lows[0]);
    plusDM.push(0);
    minusDM.push(0);
    for (let i = 1; i < closes.length; i++) {
        const h_l = highs[i] - lows[i];
        const h_pc = Math.abs(highs[i] - closes[i - 1]);
        const l_pc = Math.abs(lows[i] - closes[i - 1]);
        tr.push(Math.max(h_l, h_pc, l_pc));
        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];
        plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
    const str = [];
    const sPlusDM = [];
    const sMinusDM = [];
    let sumTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let sumPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let sumMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            str.push(tr.slice(0, i + 1).reduce((a, b) => a + b, 0));
            sPlusDM.push(plusDM.slice(0, i + 1).reduce((a, b) => a + b, 0));
            sMinusDM.push(minusDM.slice(0, i + 1).reduce((a, b) => a + b, 0));
        }
        else if (i === period - 1) {
            str.push(sumTR);
            sPlusDM.push(sumPlusDM);
            sMinusDM.push(sumMinusDM);
        }
        else {
            sumTR = sumTR - (sumTR / period) + tr[i];
            sumPlusDM = sumPlusDM - (sumPlusDM / period) + plusDM[i];
            sumMinusDM = sumMinusDM - (sumMinusDM / period) + minusDM[i];
            str.push(sumTR);
            sPlusDM.push(sumPlusDM);
            sMinusDM.push(sumMinusDM);
        }
        const t = str[i] === 0 ? 1 : str[i];
        plusDI.push(100 * sPlusDM[i] / t);
        minusDI.push(100 * sMinusDM[i] / t);
    }
    const dx = [];
    for (let i = 0; i < closes.length; i++) {
        const sum = plusDI[i] + minusDI[i];
        const diff = Math.abs(plusDI[i] - minusDI[i]);
        dx.push(sum === 0 ? 0 : 100 * diff / sum);
    }
    let sumDX = dx.slice(0, period).reduce((a, b) => a + b, 0) / Math.min(period, dx.length);
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            adx.push(dx.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1));
        }
        else if (i === period - 1) {
            adx.push(sumDX);
        }
        else {
            sumDX = (sumDX * (period - 1) + dx[i]) / period;
            adx.push(sumDX);
        }
    }
    return { plusDI, minusDI, adx };
}
function computeVWAP(highs, lows, closes, volumes, period = 20) {
    const vwap = [];
    const vwapDeviation = [];
    for (let i = 0; i < closes.length; i++) {
        const start = Math.max(0, i - period + 1);
        let sumTypicalVolume = 0;
        let sumVolume = 0;
        const typicalPrices = [];
        for (let j = start; j <= i; j++) {
            const tp = (highs[j] + lows[j] + closes[j]) / 3;
            typicalPrices.push(tp);
            sumTypicalVolume += tp * volumes[j];
            sumVolume += volumes[j];
        }
        const currentVwap = sumVolume === 0 ? closes[i] : sumTypicalVolume / sumVolume;
        vwap.push(currentVwap);
        let devSum = 0;
        for (const tp of typicalPrices) {
            devSum += Math.pow(tp - currentVwap, 2);
        }
        const stdDev = Math.sqrt(devSum / typicalPrices.length);
        vwapDeviation.push(stdDev);
    }
    return { vwap, vwapDeviation };
}
/** Safe array accessor — returns 0 for NaN or out-of-bounds */
function safeAt(arr, idx, fallback = 0) {
    if (idx < 0 || idx >= arr.length)
        return fallback;
    const v = arr[idx];
    return (v === undefined || isNaN(v)) ? fallback : v;
}
/**
 * MACD (Moving Average Convergence/Divergence).
 * Returns macd line, signal line, and histogram arrays aligned to the input length.
 * Bars without enough data are filled with NaN.
 */
function computeMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEma = computeEMA(closes, fastPeriod);
    const slowEma = computeEMA(closes, slowPeriod);
    const macd = closes.map((_, i) => {
        const f = fastEma[i];
        const s = slowEma[i];
        return (isNaN(f) || isNaN(s)) ? NaN : f - s;
    });
    // Signal line: EMA of MACD values (using only valid MACD bars)
    // Build an array of valid values starting at the first non-NaN MACD
    const signal = new Array(closes.length).fill(NaN);
    const histogram = new Array(closes.length).fill(NaN);
    // Find first valid MACD index
    let firstValidIdx = closes.findIndex((_, i) => !isNaN(macd[i]));
    if (firstValidIdx < 0)
        return { macd, signal, histogram };
    const validMacd = macd.slice(firstValidIdx);
    const k = 2 / (signalPeriod + 1);
    if (validMacd.length < signalPeriod)
        return { macd, signal, histogram };
    let currentSignal = validMacd.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
    signal[firstValidIdx + signalPeriod - 1] = currentSignal;
    histogram[firstValidIdx + signalPeriod - 1] = validMacd[signalPeriod - 1] - currentSignal;
    for (let i = signalPeriod; i < validMacd.length; i++) {
        currentSignal = validMacd[i] * k + currentSignal * (1 - k);
        const absIdx = firstValidIdx + i;
        signal[absIdx] = currentSignal;
        histogram[absIdx] = macd[absIdx] - currentSignal;
    }
    return { macd, signal, histogram };
}
