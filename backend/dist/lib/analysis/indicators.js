"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSMA = computeSMA;
exports.computeEMA = computeEMA;
exports.computeMACD = computeMACD;
exports.computeRSI = computeRSI;
exports.computeBollingerBands = computeBollingerBands;
exports.computeATR = computeATR;
exports.computeStochastic = computeStochastic;
exports.computeWilliamsR = computeWilliamsR;
exports.computeCCI = computeCCI;
exports.computeOBV = computeOBV;
exports.computeADX = computeADX;
exports.computeVWAP = computeVWAP;
function computeSMA(values, period) {
    const sma = [];
    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - period + 1);
        const window = values.slice(start, i + 1);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        sma.push(avg);
    }
    return sma;
}
function computeEMA(values, period) {
    const ema = [];
    if (values.length === 0)
        return [];
    const k = 2 / (period + 1);
    let prevEma = values[0];
    ema.push(prevEma);
    for (let i = 1; i < values.length; i++) {
        const curEma = values[i] * k + prevEma * (1 - k);
        ema.push(curEma);
        prevEma = curEma;
    }
    return ema;
}
function computeMACD(closes, fast = 12, slow = 26, signal = 9) {
    const fastEma = computeEMA(closes, fast);
    const slowEma = computeEMA(closes, slow);
    const macdLine = [];
    for (let i = 0; i < closes.length; i++) {
        macdLine.push(fastEma[i] - slowEma[i]);
    }
    const signalLine = computeEMA(macdLine, signal);
    const histogram = [];
    for (let i = 0; i < closes.length; i++) {
        histogram.push(macdLine[i] - signalLine[i]);
    }
    return { macd: macdLine, signal: signalLine, histogram };
}
function computeRSI(closes, period = 14) {
    const rsi = [];
    if (closes.length === 0)
        return [];
    let avgGain = 0;
    let avgLoss = 0;
    rsi.push(50); // initial fallback
    for (let i = 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        if (i <= period) {
            avgGain += gain;
            avgLoss += loss;
            if (i === period) {
                avgGain /= period;
                avgLoss /= period;
                const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                rsi.push(100 - 100 / (1 + rs));
            }
            else {
                rsi.push(50);
            }
        }
        else {
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi.push(100 - 100 / (1 + rs));
        }
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
        const start = Math.max(0, i - period + 1);
        const window = closes.slice(start, i + 1);
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        let variance = 0;
        if (window.length > 1) {
            variance = window.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / window.length;
        }
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
        const start = Math.max(0, i - kPeriod + 1);
        const windowHighs = highs.slice(start, i + 1);
        const windowLows = lows.slice(start, i + 1);
        const highestHigh = Math.max(...windowHighs);
        const lowestLow = Math.min(...windowLows);
        const range = highestHigh - lowestLow;
        const val = range === 0 ? 50 : 100 * (closes[i] - lowestLow) / range;
        k.push(val);
    }
    const d = computeSMA(k, dPeriod);
    return { k, d };
}
function computeWilliamsR(highs, lows, closes, period = 14) {
    const wR = [];
    for (let i = 0; i < closes.length; i++) {
        const start = Math.max(0, i - period + 1);
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
        const start = Math.max(0, i - period + 1);
        const windowTp = tp.slice(start, i + 1);
        const meanTp = smaTp[i];
        const meanDev = windowTp.reduce((sum, v) => sum + Math.abs(v - meanTp), 0) / windowTp.length;
        const currentCCI = meanDev === 0 ? 0 : (tp[i] - meanTp) / (0.015 * meanDev);
        cci.push(currentCCI);
    }
    return cci;
}
function computeOBV(closes, volumes) {
    const obv = [];
    if (closes.length === 0)
        return [];
    let currentObv = volumes[0];
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
        const windowVolumes = [];
        for (let j = start; j <= i; j++) {
            const tp = (highs[j] + lows[j] + closes[j]) / 3;
            typicalPrices.push(tp);
            windowVolumes.push(volumes[j]);
            sumTypicalVolume += tp * volumes[j];
            sumVolume += volumes[j];
        }
        const currentVwap = sumVolume === 0 ? closes[i] : sumTypicalVolume / sumVolume;
        vwap.push(currentVwap);
        let devSum = 0;
        for (let j = 0; j < typicalPrices.length; j++) {
            devSum += Math.pow(typicalPrices[j] - currentVwap, 2);
        }
        const stdDev = Math.sqrt(devSum / typicalPrices.length);
        vwapDeviation.push(stdDev);
    }
    return { vwap, vwapDeviation };
}
