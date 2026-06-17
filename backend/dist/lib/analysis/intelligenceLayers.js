"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRegime = computeRegime;
exports.calculateUpgradedAnalytics = calculateUpgradedAnalytics;
const nifty50Symbols_1 = require("../../services/dataIngestion/nifty50Symbols");
function computeRegime(hurst, er, adx, rv, dd) {
    if (adx > 22 && er > 0.4 && hurst > 0.52) {
        return 'Persistent Trend';
    }
    else if (rv > 22 && dd > 8) {
        return 'Volatility Expansion';
    }
    else if (rv < 14 && dd < 3) {
        return 'Volatility Compression';
    }
    else if (adx < 18 && er < 0.35 && hurst < 0.48) {
        return 'Range Bound';
    }
    return 'Transitional';
}
function calculateUpgradedAnalytics(input) {
    const { ticker, closes, highs, lows, volumes, dates, rsi, macdHistogram, adx, atr, hurstExponent, efficiencyRatio, realizedVolatility, drawdown, zScore, percentileRank, volumeRatio, confluenceScore, pivots, allGroupedCandles } = input;
    const tLatest = closes.length - 1;
    // ----------------------------------------------------
    // LAYER 3 — REGIME DETECTION
    // ----------------------------------------------------
    // We classify every index from 20 onwards
    const regimes = [];
    // Fill the first 20 days with Transitional
    for (let i = 0; i < 20; i++) {
        regimes.push('Transitional');
    }
    // Calculate rolling indicators to get historical regimes
    const historicalHurst = [];
    const historicalER = [];
    const historicalRV = [];
    for (let i = 0; i < closes.length; i++) {
        // Hurst
        if (i < 80) {
            historicalHurst.push(0.5);
        }
        else {
            // mini-hurst
            const logRet = [];
            for (let j = i - 79; j <= i; j++) {
                logRet.push(Math.log(closes[j] / closes[j - 1]));
            }
            const mean = logRet.reduce((a, b) => a + b, 0) / 80;
            const std = Math.sqrt(logRet.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 80);
            historicalHurst.push(std === 0 ? 0.5 : 0.6); // simple proxy for historical
        }
        // ER
        if (i < 20) {
            historicalER.push(0.5);
        }
        else {
            const directionalMove = Math.abs(closes[i] - closes[i - 20]);
            let noise = 0;
            for (let j = i - 19; j <= i; j++) {
                noise += Math.abs(closes[j] - closes[j - 1]);
            }
            historicalER.push(noise === 0 ? 1 : directionalMove / noise);
        }
        // RV
        if (i < 20) {
            historicalRV.push(15);
        }
        else {
            const logRet = [];
            for (let j = i - 19; j <= i; j++) {
                logRet.push(Math.log(closes[j] / closes[j - 1]));
            }
            const mean = logRet.reduce((a, b) => a + b, 0) / 20;
            const std = Math.sqrt(logRet.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 20);
            historicalRV.push(std * Math.sqrt(252) * 100);
        }
    }
    for (let i = 20; i < closes.length; i++) {
        const curH = historicalHurst[i];
        const curER = historicalER[i];
        const curADX = adx[i] || 20;
        const curRV = historicalRV[i];
        const curDD = drawdown.underwaterCurve[i] || 0;
        regimes.push(computeRegime(curH, curER, curADX, curRV, curDD));
    }
    const currentRegime = regimes[tLatest];
    // Calculate consecutive days spent in current regime
    let consecutiveDays = 0;
    for (let i = tLatest; i >= 0; i--) {
        if (regimes[i] === currentRegime) {
            consecutiveDays++;
        }
        else {
            break;
        }
    }
    // Calculate historical frequency
    const regimeCounts = regimes.reduce((acc, r) => {
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});
    const historicalFrequency = (regimeCounts[currentRegime] || 1) / closes.length * 100;
    // ----------------------------------------------------
    // LAYER 1 — HISTORICAL ANALOG SEARCH
    // ----------------------------------------------------
    // Feature vector generator
    const getFeatureVector = (idx) => {
        const r = rsi[idx] || 50;
        const hist = macdHistogram[idx] || 0;
        const ax = adx[idx] || 20;
        const at = atr[idx] || 0;
        const h = historicalHurst[idx] || 0.5;
        const e = historicalER[idx] || 0.5;
        const rv = historicalRV[idx] || 15;
        const dd = drawdown.underwaterCurve[idx] || 0;
        const zs = idx < 20 ? 0 : (closes[idx] - closes.slice(idx - 20, idx).reduce((a, b) => a + b, 0) / 20) / (Math.sqrt(closes.slice(idx - 20, idx).reduce((s, v) => s + Math.pow(v - (closes.slice(idx - 20, idx).reduce((a, b) => a + b, 0) / 20), 2), 0) / 20) || 1);
        // Percentile in running 150d window
        const windowStart = Math.max(0, idx - 149);
        const windowCloses = closes.slice(windowStart, idx + 1);
        const minW = Math.min(...windowCloses);
        const maxW = Math.max(...windowCloses);
        const pct = maxW === minW ? 50 : 100 * (closes[idx] - minW) / (maxW - minW);
        // Volume ratio
        const volStart = Math.max(0, idx - 20);
        const volAvg = volumes.slice(volStart, idx + 1).reduce((a, b) => a + b, 0) / (idx - volStart + 1) || 1;
        const vr = volumes[idx] / volAvg;
        // Confluence proxy (scale trend/mom/vol/vol)
        const conf = 0.2; // default or cached proxy
        return [
            r / 100, // RSI
            Math.max(0, Math.min(1, (hist / closes[idx]) * 50 + 0.5)), // MACD
            ax / 100, // ADX
            Math.min(1, at / closes[idx] * 20), // ATR
            h, // Hurst
            e, // ER
            Math.min(1, rv / 100), // RV
            dd / 100, // Drawdown
            Math.max(0, Math.min(1, (zs + 3) / 6)), // Z-score
            pct / 100, // Percentile
            Math.min(1, vr / 5), // Vol ratio
            conf // Confluence
        ];
    };
    const currentVector = getFeatureVector(tLatest);
    // Compute cosine similarity for candidate indices [20, tLatest - 20]
    const analogs = [];
    const endLimit = tLatest - 20;
    for (let i = 20; i <= endLimit; i++) {
        const vecI = getFeatureVector(i);
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let k = 0; k < currentVector.length; k++) {
            dot += currentVector[k] * vecI[k];
            normA += currentVector[k] * currentVector[k];
            normB += vecI[k] * vecI[k];
        }
        const similarity = normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
        // subsequent periods data
        const sub5dReturn = ((closes[i + 5] - closes[i]) / closes[i]) * 100;
        const sub20dReturn = ((closes[i + 20] - closes[i]) / closes[i]) * 100;
        const volChange = historicalRV[i + 20] - historicalRV[i];
        // State similarity breakdown (differences)
        const breakdown = {
            rsi: 1 - Math.abs(currentVector[0] - vecI[0]),
            macd: 1 - Math.abs(currentVector[1] - vecI[1]),
            adx: 1 - Math.abs(currentVector[2] - vecI[2]),
            atr: 1 - Math.abs(currentVector[3] - vecI[3]),
            hurst: 1 - Math.abs(currentVector[4] - vecI[4]),
            efficiency: 1 - Math.abs(currentVector[5] - vecI[5]),
            volatility: 1 - Math.abs(currentVector[6] - vecI[6]),
            drawdown: 1 - Math.abs(currentVector[7] - vecI[7]),
            zScore: 1 - Math.abs(currentVector[8] - vecI[8]),
            percentile: 1 - Math.abs(currentVector[9] - vecI[9]),
            volumeRatio: 1 - Math.abs(currentVector[10] - vecI[10])
        };
        analogs.push({
            date: dates[i].toISOString().split('T')[0],
            similarity: similarity * 100,
            marketStructure: regimes[i],
            sub5dReturn,
            sub20dReturn,
            volatilityChange: volChange,
            breakdown
        });
    }
    // Sort and pick top 5
    analogs.sort((a, b) => b.similarity - a.similarity);
    const topAnalogs = analogs.slice(0, 5);
    // ----------------------------------------------------
    // LAYER 2 — INDICATOR ATTRIBUTION
    // ----------------------------------------------------
    // Composite score is: (trend + momentum + volatility + volume + structure) / 5
    const structure = pivots && pivots.classic ? (closes[tLatest] >= pivots.classic.pivot
        ? Math.max(-1, Math.min(1, -(closes[tLatest] - pivots.classic.pivot) / (pivots.classic.r1 - pivots.classic.pivot || 1)))
        : Math.max(-1, Math.min(1, (pivots.classic.pivot - closes[tLatest]) / (pivots.classic.pivot - pivots.classic.s1 || 1)))) : 0;
    const indicatorAttribution = {
        trend: confluenceScore.trend * 0.2,
        momentum: confluenceScore.momentum * 0.2,
        volatility: confluenceScore.volatility * 0.2,
        volume: confluenceScore.volume * 0.2,
        structure: structure * 0.2
    };
    // Adjust composite confluence score to include structure
    const compositeWithStructure = (confluenceScore.trend +
        confluenceScore.momentum +
        confluenceScore.volatility +
        confluenceScore.volume +
        structure) / 5;
    // ----------------------------------------------------
    // LAYER 4 — WHAT CHANGED SINCE YESTERDAY
    // ----------------------------------------------------
    const getDeltas = () => {
        if (tLatest < 1)
            return { biggestIncrease: null, biggestDecrease: null, deltas: {} };
        const dRsi = rsi[tLatest] - rsi[tLatest - 1];
        const dMacd = macdHistogram[tLatest] - macdHistogram[tLatest - 1];
        const dAdx = adx[tLatest] - adx[tLatest - 1];
        const dVol = historicalRV[tLatest] - historicalRV[tLatest - 1];
        const dVolumeRatio = volumeRatio - (volumes[tLatest - 1] / (volumes.slice(Math.max(0, tLatest - 21), tLatest - 1).reduce((a, b) => a + b, 0) / 20 || 1));
        const dConf = compositeWithStructure - ((confluenceScore.trend + confluenceScore.momentum + confluenceScore.volatility + confluenceScore.volume + structure) / 5 // proxy for yesterday
        ) * 0.98; // slight decay factor for mock
        const dDrawdown = drawdown.underwaterCurve[tLatest] - drawdown.underwaterCurve[tLatest - 1];
        const deltaList = [
            { name: 'RSI', val: dRsi, formatted: dRsi.toFixed(1) },
            { name: 'MACD', val: dMacd, formatted: dMacd.toFixed(4) },
            { name: 'ADX', val: dAdx, formatted: dAdx.toFixed(1) },
            { name: 'Volatility', val: dVol, formatted: `${dVol.toFixed(1)}%` },
            { name: 'Volume Ratio', val: dVolumeRatio, formatted: `${dVolumeRatio.toFixed(2)}x` },
            { name: 'Confluence', val: dConf, formatted: dConf.toFixed(2) },
            { name: 'Drawdown', val: dDrawdown, formatted: `${dDrawdown.toFixed(1)}%` }
        ];
        deltaList.sort((a, b) => b.val - a.val);
        return {
            biggestIncrease: deltaList[0],
            biggestDecrease: deltaList[deltaList.length - 1],
            deltas: {
                rsi: dRsi,
                macd: dMacd,
                adx: dAdx,
                volatility: dVol,
                volumeRatio: dVolumeRatio,
                confluence: dConf,
                drawdown: dDrawdown
            }
        };
    };
    const changes = getDeltas();
    // ----------------------------------------------------
    // LAYER 5 — CONFIDENCE SCORE
    // ----------------------------------------------------
    const agreementFactor = Math.abs(compositeWithStructure) * 100;
    const stabilityFactor = Math.min(100, consecutiveDays * 12);
    const sufficiencyFactor = (closes.length / 150) * 100;
    const volConsistencyFactor = Math.max(0, 100 - Math.min(50, realizedVolatility) * 2);
    const confidenceScoreVal = Math.round((agreementFactor + stabilityFactor + sufficiencyFactor + volConsistencyFactor) / 4);
    const confidenceScore = {
        score: confidenceScoreVal,
        factors: {
            agreement: agreementFactor,
            stability: stabilityFactor,
            sufficiency: sufficiencyFactor,
            volatility: volConsistencyFactor
        }
    };
    // ----------------------------------------------------
    // LAYER 6 — NIFTY RELATIVE STRENGTH
    // ----------------------------------------------------
    // Returns helper
    const computeReturn = (tickerCloses, days) => {
        if (tickerCloses.length < days + 1)
            return 0;
        const cur = tickerCloses[tickerCloses.length - 1];
        const prev = tickerCloses[tickerCloses.length - 1 - days];
        return prev === 0 ? 0 : ((cur - prev) / prev) * 100;
    };
    // Compute returns for current ticker
    const ret5d = computeReturn(closes, 5);
    const ret20d = computeReturn(closes, 20);
    const ret60d = computeReturn(closes, 60);
    const ret120d = computeReturn(closes, 120);
    // Compute returns for all other NIFTY 50 tickers
    const windows = [5, 20, 60, 120];
    const returnsBySymbol = {};
    for (const sym of Object.keys(allGroupedCandles)) {
        const symCandles = allGroupedCandles[sym];
        const symCloses = symCandles.map(c => c.close);
        returnsBySymbol[sym] = {
            5: computeReturn(symCloses, 5),
            20: computeReturn(symCloses, 20),
            60: computeReturn(symCloses, 60),
            120: computeReturn(symCloses, 120)
        };
    }
    // Calculate Percentile Rank among NIFTY 50
    const getPercentileRank = (val, window) => {
        const allVals = Object.keys(returnsBySymbol).map(s => returnsBySymbol[s][window]);
        const lowerCount = allVals.filter(v => v < val).length;
        return allVals.length === 0 ? 50 : (lowerCount / allVals.length) * 100;
    };
    const relStrengthRanks = {
        rank5d: getPercentileRank(ret5d, 5),
        rank20d: getPercentileRank(ret20d, 20),
        rank60d: getPercentileRank(ret60d, 60),
        rank120d: getPercentileRank(ret120d, 120)
    };
    // Calculate Sector average return
    const curMetadata = nifty50Symbols_1.NIFTY_50_METADATA[ticker] || nifty50Symbols_1.NIFTY_50_METADATA[ticker + '.NS'] || { sector: 'Other' };
    const sector = curMetadata.sector;
    // Filter returns of peers in same sector
    const sectorPeers = Object.keys(nifty50Symbols_1.NIFTY_50_METADATA).filter(s => nifty50Symbols_1.NIFTY_50_METADATA[s].sector === sector && s !== ticker);
    const getSectorAvg = (window) => {
        const peerVals = sectorPeers.map(s => returnsBySymbol[s]?.[window] || 0);
        if (peerVals.length === 0)
            return 0;
        return peerVals.reduce((a, b) => a + b, 0) / peerVals.length;
    };
    const sectorComparison = {
        sectorName: sector,
        avg5d: getSectorAvg(5),
        avg20d: getSectorAvg(20),
        avg60d: getSectorAvg(60),
        avg120d: getSectorAvg(120)
    };
    const relativeStrength = {
        performance: {
            5: ret5d,
            20: ret20d,
            60: ret60d,
            120: ret120d
        },
        percentiles: relStrengthRanks,
        sectorComparison
    };
    // ----------------------------------------------------
    // LAYER 7 — MARKET DNA
    // ----------------------------------------------------
    // Average relative strength rank
    const avgRS = (relStrengthRanks.rank5d + relStrengthRanks.rank20d + relStrengthRanks.rank60d + relStrengthRanks.rank120d) / 4;
    // Volume rank among NIFTY 50
    const curVol = volumes[tLatest];
    const allVols = Object.keys(allGroupedCandles).map(s => {
        const len = allGroupedCandles[s].length;
        return len > 0 ? allGroupedCandles[s][len - 1].volume : 0;
    });
    const lowerVols = allVols.filter(v => v < curVol).length;
    const volRank = allVols.length === 0 ? 50 : (lowerVols / allVols.length) * 100;
    const marketDNA = {
        trendPersistence: Math.min(100, (adx[tLatest] || 20) * 2.5),
        momentum: rsi[tLatest] || 50,
        volatility: Math.max(0, 100 - realizedVolatility * 2.5),
        liquidity: volRank,
        participation: Math.min(100, volumeRatio * 40),
        drawdownStability: Math.max(0, 100 - drawdown.maxDrawdown),
        relativeStrength: avgRS
    };
    return {
        historicalAnalogs: topAnalogs,
        indicatorAttribution,
        compositeConfluence: compositeWithStructure,
        regimeDetection: {
            currentRegime,
            daysSpent: consecutiveDays,
            historicalFrequency
        },
        dailyDelta: changes,
        confidenceScore,
        relativeStrength,
        marketDNA
    };
}
