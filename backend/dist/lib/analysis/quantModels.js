"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHurstExponent = calculateHurstExponent;
exports.calculateEfficiencyRatio = calculateEfficiencyRatio;
exports.calculateZScore = calculateZScore;
exports.calculateRealizedVolatility = calculateRealizedVolatility;
exports.calculateAutocorrelation = calculateAutocorrelation;
exports.calculateDrawdown = calculateDrawdown;
exports.calculateReturnStats = calculateReturnStats;
exports.calculatePricePercentileRank = calculatePricePercentileRank;
exports.calculateVolumeProfile = calculateVolumeProfile;
exports.computeIchimoku = computeIchimoku;
exports.calculatePivots = calculatePivots;
exports.calculateConfluence = calculateConfluence;
const indicators_1 = require("./indicators");
function calculateHurstExponent(closes) {
    if (closes.length < 80)
        return 0.5;
    const logReturns = [];
    for (let i = 1; i < closes.length; i++) {
        logReturns.push(Math.log(closes[i] / closes[i - 1]));
    }
    const computeRS = (N) => {
        const sub = logReturns.slice(logReturns.length - N);
        const mean = sub.reduce((a, b) => a + b, 0) / N;
        const dev = sub.map(v => v - mean);
        const cumDev = [];
        let accum = 0;
        for (let i = 0; i < N; i++) {
            accum += dev[i];
            cumDev.push(accum);
        }
        const maxDev = Math.max(...cumDev);
        const minDev = Math.min(...cumDev);
        const range = maxDev - minDev;
        const variance = sub.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / N;
        const stdDev = Math.sqrt(variance);
        return stdDev === 0 ? 0 : range / stdDev;
    };
    const rs20 = computeRS(20);
    const rs40 = computeRS(40);
    const rs80 = computeRS(80);
    if (rs20 === 0 || rs40 === 0 || rs80 === 0)
        return 0.5;
    const x = [Math.log(20), Math.log(40), Math.log(80)];
    const y = [Math.log(rs20), Math.log(rs40), Math.log(rs80)];
    const meanX = x.reduce((a, b) => a + b, 0) / 3;
    const meanY = y.reduce((a, b) => a + b, 0) / 3;
    let num = 0;
    let den = 0;
    for (let i = 0; i < 3; i++) {
        num += (x[i] - meanX) * (y[i] - meanY);
        den += Math.pow(x[i] - meanX, 2);
    }
    const hurst = den === 0 ? 0.5 : num / den;
    return Math.max(0, Math.min(1, hurst));
}
function calculateEfficiencyRatio(closes, period = 20) {
    if (closes.length < period + 1)
        return 0.5;
    const latest = closes[closes.length - 1];
    const start = closes[closes.length - 1 - period];
    const directionalMove = Math.abs(latest - start);
    let noise = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
        noise += Math.abs(closes[i] - closes[i - 1]);
    }
    return noise === 0 ? 1 : directionalMove / noise;
}
function calculateZScore(closes, period = 20) {
    if (closes.length < period)
        return 0;
    const window = closes.slice(closes.length - period);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    return std === 0 ? 0 : (closes[closes.length - 1] - mean) / std;
}
function calculateRealizedVolatility(closes, period = 20) {
    if (closes.length < period + 1)
        return 0;
    const logReturns = [];
    for (let i = closes.length - period; i < closes.length; i++) {
        logReturns.push(Math.log(closes[i] / closes[i - 1]));
    }
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / logReturns.length;
    const std = Math.sqrt(variance);
    return std * Math.sqrt(252) * 100;
}
function calculateAutocorrelation(closes, lags = [1, 2, 3, 5, 10]) {
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
        returns.push(closes[i] - closes[i - 1] === 0 ? 0 : (closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    if (returns.length < 2) {
        const results = {};
        for (const lag of lags)
            results[lag] = 0;
        return results;
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    const results = {};
    for (const lag of lags) {
        if (returns.length <= lag) {
            results[lag] = 0;
            continue;
        }
        let covariance = 0;
        for (let i = lag; i < returns.length; i++) {
            covariance += (returns[i] - mean) * (returns[i - lag] - mean);
        }
        results[lag] = variance === 0 ? 0 : covariance / variance;
    }
    return results;
}
function calculateDrawdown(closes) {
    if (closes.length === 0) {
        return { maxDrawdown: 0, currentDrawdown: 0, durationDays: 0, underwaterCurve: [] };
    }
    const underwaterCurve = [];
    let runningPeak = closes[0];
    let maxDrawdown = 0;
    let peakIndex = 0;
    for (let i = 0; i < closes.length; i++) {
        if (closes[i] > runningPeak) {
            runningPeak = closes[i];
            peakIndex = i;
        }
        const dd = ((runningPeak - closes[i]) / runningPeak) * 100;
        underwaterCurve.push(dd);
        if (dd > maxDrawdown) {
            maxDrawdown = dd;
        }
    }
    const currentDrawdown = underwaterCurve[underwaterCurve.length - 1];
    const durationDays = underwaterCurve.length - 1 - peakIndex;
    return {
        maxDrawdown,
        currentDrawdown,
        durationDays,
        underwaterCurve
    };
}
function calculateReturnStats(closes) {
    if (closes.length < 2) {
        return { annualizedReturn: 0, annualizedVolatility: 0, sharpeRatio: 0, sortinoRatio: 0, skewness: 0, kurtosis: 0 };
    }
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
        returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const n = returns.length;
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    const firstClose = closes[0];
    const lastClose = closes[closes.length - 1];
    const annualizedReturn = (firstClose === 0 ? 0 : Math.pow(lastClose / firstClose, 252 / closes.length) - 1) * 100;
    const annualizedVolatility = std * Math.sqrt(252) * 100;
    const rf = 6.5;
    const sharpeRatio = annualizedVolatility === 0 ? 0 : (annualizedReturn - rf) / annualizedVolatility;
    const negativeReturns = returns.filter(r => r < 0);
    let downsideVolatility = 0;
    if (negativeReturns.length > 0) {
        const downsideSum = returns.reduce((sum, r) => sum + (r < 0 ? Math.pow(r, 2) : 0), 0);
        downsideVolatility = Math.sqrt(downsideSum / n) * Math.sqrt(252) * 100;
    }
    const sortinoRatio = downsideVolatility === 0 ? 0 : (annualizedReturn - rf) / downsideVolatility;
    let skewness = 0;
    let kurtosis = 0;
    if (std > 0) {
        let skewSum = 0;
        let kurtSum = 0;
        for (const r of returns) {
            skewSum += Math.pow(r - mean, 3);
            kurtSum += Math.pow(r - mean, 4);
        }
        skewness = (skewSum / n) / Math.pow(std, 3);
        kurtosis = ((kurtSum / n) / Math.pow(std, 4)) - 3;
    }
    return {
        annualizedReturn,
        annualizedVolatility,
        sharpeRatio,
        sortinoRatio,
        skewness,
        kurtosis
    };
}
function calculatePricePercentileRank(closes) {
    if (closes.length === 0)
        return 50;
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min;
    return range === 0 ? 50 : 100 * (closes[closes.length - 1] - min) / range;
}
function calculateVolumeProfile(closes, volumes) {
    if (closes.length === 0 || volumes.length === 0) {
        return { profile: [], pointOfControl: 0 };
    }
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice;
    const bucketCount = 10;
    const buckets = Array.from({ length: bucketCount }, (_, idx) => {
        const low = minPrice + (priceRange / bucketCount) * idx;
        const high = minPrice + (priceRange / bucketCount) * (idx + 1);
        const center = (low + high) / 2;
        return { low, high, center, volume: 0 };
    });
    let totalVolume = 0;
    for (let i = 0; i < closes.length; i++) {
        const price = closes[i];
        const vol = volumes[i];
        totalVolume += vol;
        for (let j = 0; j < bucketCount; j++) {
            if (price >= buckets[j].low && (j === bucketCount - 1 ? price <= buckets[j].high : price < buckets[j].high)) {
                buckets[j].volume += vol;
                break;
            }
        }
    }
    const profile = buckets.map(b => ({
        priceLevel: b.center,
        low: b.low,
        high: b.high,
        volumePct: totalVolume === 0 ? 0 : (b.volume / totalVolume) * 100
    }));
    let maxVolIdx = 0;
    let maxVol = 0;
    for (let j = 0; j < bucketCount; j++) {
        if (buckets[j].volume > maxVol) {
            maxVol = buckets[j].volume;
            maxVolIdx = j;
        }
    }
    return {
        profile,
        pointOfControl: buckets[maxVolIdx].center
    };
}
function computeIchimoku(highs, lows, closes) {
    const tenkan = [];
    const kijun = [];
    const senkouA = [];
    const senkouB = [];
    const chikou = [];
    for (let i = 0; i < closes.length; i++) {
        const tStart = Math.max(0, i - 9 + 1);
        const tHigh = Math.max(...highs.slice(tStart, i + 1));
        const tLow = Math.min(...lows.slice(tStart, i + 1));
        tenkan.push((tHigh + tLow) / 2);
        const kStart = Math.max(0, i - 26 + 1);
        const kHigh = Math.max(...highs.slice(kStart, i + 1));
        const kLow = Math.min(...lows.slice(kStart, i + 1));
        kijun.push((kHigh + kLow) / 2);
        chikou.push(closes[i]);
    }
    for (let i = 0; i < closes.length; i++) {
        const prevIdx = i - 26;
        if (prevIdx < 0) {
            senkouA.push((tenkan[i] + kijun[i]) / 2);
            const bStart = Math.max(0, i - 52 + 1);
            const bHigh = Math.max(...highs.slice(bStart, i + 1));
            const bLow = Math.min(...lows.slice(bStart, i + 1));
            senkouB.push((bHigh + bLow) / 2);
        }
        else {
            senkouA.push((tenkan[prevIdx] + kijun[prevIdx]) / 2);
            const bStart = Math.max(0, prevIdx - 52 + 1);
            const bHigh = Math.max(...highs.slice(bStart, prevIdx + 1));
            const bLow = Math.min(...lows.slice(bStart, prevIdx + 1));
            senkouB.push((bHigh + bLow) / 2);
        }
    }
    const currentClose = closes[closes.length - 1];
    const currentA = senkouA[senkouA.length - 1];
    const currentB = senkouB[senkouB.length - 1];
    let position = "inside";
    if (currentClose > Math.max(currentA, currentB)) {
        position = "above";
    }
    else if (currentClose < Math.min(currentA, currentB)) {
        position = "below";
    }
    return { tenkan, kijun, senkouA, senkouB, chikou, position };
}
function calculatePivots(candles) {
    if (candles.length === 0) {
        return { classic: null, fibonacci: null, camarilla: null };
    }
    const getWeekKey = (date) => {
        const d = new Date(date);
        const target = new Date(d.valueOf());
        const dayNr = (d.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
        return `${target.getFullYear()}-W${weekNum}`;
    };
    const grouped = {};
    for (const c of candles) {
        const key = getWeekKey(c.date);
        if (!grouped[key])
            grouped[key] = [];
        grouped[key].push(c);
    }
    const keys = Object.keys(grouped).sort();
    if (keys.length < 2) {
        const key = keys[0];
        return computePivotsFromCandles(grouped[key]);
    }
    const completedWeekKey = keys[keys.length - 2];
    return computePivotsFromCandles(grouped[completedWeekKey]);
}
function computePivotsFromCandles(weekCandles) {
    const high = Math.max(...weekCandles.map(c => c.high));
    const low = Math.min(...weekCandles.map(c => c.low));
    const close = weekCandles[weekCandles.length - 1].close;
    const ppClassic = (high + low + close) / 3;
    const classic = {
        pivot: ppClassic,
        r1: 2 * ppClassic - low,
        s1: 2 * ppClassic - high,
        r2: ppClassic + (high - low),
        s2: ppClassic - (high - low),
        r3: high + 2 * (ppClassic - low),
        s3: low - 2 * (high - ppClassic)
    };
    const fibonacci = {
        pivot: ppClassic,
        r1: ppClassic + 0.382 * (high - low),
        s1: ppClassic - 0.382 * (high - low),
        r2: ppClassic + 0.618 * (high - low),
        s2: ppClassic - 0.618 * (high - low),
        r3: ppClassic + 1.000 * (high - low),
        s3: ppClassic - 1.000 * (high - low)
    };
    const range = high - low;
    const camarilla = {
        pivot: ppClassic,
        r1: close + 1.1 * range / 12,
        s1: close - 1.1 * range / 12,
        r2: close + 1.1 * range / 6,
        s2: close - 1.1 * range / 6,
        r3: close + 1.1 * range / 4,
        s3: close - 1.1 * range / 4,
        r4: close + 1.1 * range / 2,
        s4: close - 1.1 * range / 2
    };
    return { classic, fibonacci, camarilla };
}
function calculateConfluence(closes, highs, lows, volumes) {
    // 1. Trend indicators
    const sma20 = (0, indicators_1.computeSMA)(closes, 20);
    const sma50 = (0, indicators_1.computeSMA)(closes, 50);
    const sma200 = (0, indicators_1.computeSMA)(closes, 200);
    const ema9 = (0, indicators_1.computeEMA)(closes, 9);
    const ema21 = (0, indicators_1.computeEMA)(closes, 21);
    const ema55 = (0, indicators_1.computeEMA)(closes, 55);
    const adxData = (0, indicators_1.computeADX)(highs, lows, closes, 14);
    const ichimoku = computeIchimoku(highs, lows, closes);
    const currentClose = closes[closes.length - 1];
    let trendCount = 0;
    let trendScoreSum = 0;
    // SMA
    const lastSma20 = sma20[sma20.length - 1];
    const lastSma50 = sma50[sma50.length - 1];
    const lastSma200 = sma200[sma200.length - 1];
    trendCount += 3;
    trendScoreSum += currentClose > lastSma20 ? 1 : -1;
    trendScoreSum += currentClose > lastSma50 ? 1 : -1;
    trendScoreSum += currentClose > lastSma200 ? 1 : -1;
    // EMA
    const lastEma9 = ema9[ema9.length - 1];
    const lastEma21 = ema21[ema21.length - 1];
    const lastEma55 = ema55[ema55.length - 1];
    trendCount += 3;
    trendScoreSum += currentClose > lastEma9 ? 1 : -1;
    trendScoreSum += currentClose > lastEma21 ? 1 : -1;
    trendScoreSum += currentClose > lastEma55 ? 1 : -1;
    // ADX
    const lastPlusDI = adxData.plusDI[adxData.plusDI.length - 1];
    const lastMinusDI = adxData.minusDI[adxData.minusDI.length - 1];
    trendCount += 1;
    trendScoreSum += lastPlusDI > lastMinusDI ? 1 : -1;
    // Ichimoku
    trendCount += 1;
    if (ichimoku.position === "above")
        trendScoreSum += 1;
    else if (ichimoku.position === "below")
        trendScoreSum -= 1;
    const trend = trendScoreSum / trendCount;
    // 2. Momentum
    const rsi = (0, indicators_1.computeRSI)(closes, 14);
    const macdData = (0, indicators_1.computeMACD)(closes, 12, 26, 9);
    const stochastic = (0, indicators_1.computeStochastic)(highs, lows, closes, 14, 3);
    const williamsR = (0, indicators_1.computeWilliamsR)(highs, lows, closes, 14);
    const cci = (0, indicators_1.computeCCI)(highs, lows, closes, 20);
    let momCount = 0;
    let momScoreSum = 0;
    // RSI
    const lastRsi = rsi[rsi.length - 1];
    momCount += 1;
    momScoreSum += (lastRsi - 50) / 20; // 50 is neutral, maps roughly to [-1, 1]
    // MACD
    const lastMacdHist = macdData.histogram[macdData.histogram.length - 1];
    const prevMacdHist = macdData.histogram[macdData.histogram.length - 2] || 0;
    momCount += 2;
    momScoreSum += lastMacdHist > 0 ? 1 : -1;
    momScoreSum += lastMacdHist > prevMacdHist ? 1 : -1; // trend of histogram
    // Stochastic
    const lastK = stochastic.k[stochastic.k.length - 1];
    const lastD = stochastic.d[stochastic.d.length - 1];
    momCount += 2;
    momScoreSum += lastK > lastD ? 1 : -1;
    momScoreSum += (lastK - 50) / 50;
    // Williams %R
    const lastWR = williamsR[williamsR.length - 1];
    momCount += 1;
    momScoreSum += (lastWR + 50) / 30; // neutral is -50
    // CCI
    const lastCCI = cci[cci.length - 1];
    momCount += 1;
    momScoreSum += Math.max(-1, Math.min(1, lastCCI / 100));
    const momentum = Math.max(-1, Math.min(1, momScoreSum / momCount));
    // 3. Volatility
    const bb = (0, indicators_1.computeBollingerBands)(closes, 20, 2);
    const zScore = calculateZScore(closes, 20);
    const rv = calculateRealizedVolatility(closes, 20);
    let volCount = 0;
    let volScoreSum = 0;
    // %B
    const lastPercentB = bb.percentB[bb.percentB.length - 1];
    volCount += 1;
    if (lastPercentB > 0.8 || lastPercentB < 0.2)
        volScoreSum += 1; // expanding/extreme
    else
        volScoreSum -= 0.5; // compressed
    // Z-Score
    volCount += 1;
    volScoreSum += Math.abs(zScore) > 1.5 ? 1 : -0.5;
    // Bandwidth trend
    const lastBandwidth = bb.bandwidth[bb.bandwidth.length - 1];
    const prevBandwidth = bb.bandwidth[bb.bandwidth.length - 2] || 0;
    volCount += 1;
    volScoreSum += lastBandwidth > prevBandwidth ? 1 : -1;
    const volatility = Math.max(-1, Math.min(1, volScoreSum / volCount));
    // 4. Volume
    const obv = (0, indicators_1.computeOBV)(closes, volumes);
    const volSma = (0, indicators_1.computeSMA)(volumes, 20);
    const vp = calculateVolumeProfile(closes, volumes);
    let volumeCount = 0;
    let volumeScoreSum = 0;
    // OBV trend
    const lastObv = obv[obv.length - 1];
    const prevObv = obv[obv.length - 3] || obv[0] || 0;
    volumeCount += 1;
    volumeScoreSum += lastObv > prevObv ? 1 : -1;
    // Volume ratio
    const lastVolume = volumes[volumes.length - 1];
    const lastVolSma = volSma[volSma.length - 1] || 1;
    const ratio = lastVolume / lastVolSma;
    volumeCount += 1;
    volumeScoreSum += ratio > 1.2 ? 1 : (ratio < 0.8 ? -1 : 0);
    // Close vs POC
    volumeCount += 1;
    volumeScoreSum += currentClose > vp.pointOfControl ? 0.5 : -0.5;
    const volume = Math.max(-1, Math.min(1, volumeScoreSum / volumeCount));
    // Composite average
    const composite = (trend + momentum + volatility + volume) / 4;
    return {
        trend,
        momentum,
        volatility,
        volume,
        composite
    };
}
