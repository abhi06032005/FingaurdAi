import { NIFTY_50_METADATA } from '../../services/dataIngestion/nifty50Symbols';
import { computeOBV, computeSMA, computeVWAP } from './indicators';
import {
  calculateEfficiencyRatio,
  calculateHurstExponent,
  calculateRealizedVolatility,
  calculateZScore
} from './quantModels';

export interface UpgradedAnalyticsInput {
  ticker: string;
  closes: number[];
  highs: number[];
  lows: number[];
  volumes: number[];
  dates: Date[];
  rsi: number[];
  macdHistogram: number[];
  adx: number[];
  atr: number[];
  hurstExponent: number;
  efficiencyRatio: number;
  realizedVolatility: number;
  drawdown: { maxDrawdown: number; currentDrawdown: number; durationDays: number; underwaterCurve: number[] };
  zScore: number;
  percentileRank: number;
  volumeRatio: number;
  confluenceScore: { trend: number; momentum: number; volatility: number; volume: number; composite: number };
  pivots: any;
  allGroupedCandles: Record<string, { close: number; date: Date; volume: number }[]>;
}

type Stance = 'supporting' | 'conflicting' | 'neutral';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const average = (values: number[]) => values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

const toDateKey = (date: Date) => date.toISOString().split('T')[0];

const scoreToStance = (score: number, threshold = 0.12): Stance => {
  if (score > threshold) return 'supporting';
  if (score < -threshold) return 'conflicting';
  return 'neutral';
};

const normalizeSigned = (value: number, divisor: number) => clamp(value / divisor, -1, 1);

const reliabilityLabel = (score: number) => {
  if (score >= 82) return 'High';
  if (score >= 68) return 'Moderate';
  return 'Fragile';
};

export function computeRegime(hurst: number, er: number, adx: number, rv: number, dd: number): string {
  if (rv > 28 || dd > 12) return 'High Variability';
  if (rv < 14 && adx < 18 && dd < 5) return 'Compression';
  if (adx > 22 && er > 0.38 && hurst > 0.52) return 'Persistent';
  if (adx < 18 && er < 0.34 && hurst <= 0.52) return 'Balanced';
  return 'Transitional';
}

function calculateStructureScore(close: number, pivots: any): number {
  if (!pivots?.classic) return 0;

  const { pivot, r1, s1 } = pivots.classic;
  if (![pivot, r1, s1].every(Number.isFinite)) return 0;

  if (close >= pivot) {
    const range = Math.max(Math.abs(r1 - pivot), 1e-9);
    return clamp(0.65 - ((close - pivot) / range), -1, 1);
  }

  const range = Math.max(Math.abs(pivot - s1), 1e-9);
  return clamp(-0.65 + ((pivot - close) / range), -1, 1);
}

function buildReliabilityRankings(input: {
  closes: number[];
  volumes: number[];
  realizedVolatility: number;
  volumeRatio: number;
}) {
  const { closes, volumes, realizedVolatility } = input;
  const dataDays = closes.length;
  const dataFactor = clamp(dataDays / 252, 0.35, 1.05);
  const volPenalty = clamp(realizedVolatility - 24, 0, 30) * 0.35;
  const hasWeakVolume = volumes.some(v => !Number.isFinite(v) || v <= 0);

  const item = (model: string, base: number, requiredDays: number, sensitivity = 1, note: string) => {
    const shortfallPenalty = dataDays >= requiredDays ? 0 : ((requiredDays - dataDays) / requiredDays) * 28;
    const score = Math.round(clamp(base * dataFactor - shortfallPenalty - (volPenalty * sensitivity), 35, 95));
    return {
      model,
      score,
      label: reliabilityLabel(score),
      note
    };
  };

  const volumePenalty = hasWeakVolume ? 12 : 0;
  const rankings = [
    item('Drawdown Analytics', 91, 60, 0.2, 'Directly observed from the price path.'),
    item('Realized Volatility', 88, 60, 0.4, 'Statistically grounded, but sensitive to regime shifts.'),
    item('SMA/EMA Trend', 86, 200, 0.6, 'Robust trend context, with overlap across moving averages.'),
    item('ATR', 84, 60, 0.5, 'Stable range measure for daily candles.'),
    item('ADX', 82, 80, 0.8, 'Useful trend-strength measure, but lagging.'),
    { ...item('VWAP / Volume Ratio', 80, 60, 0.6, 'Depends on clean volume data.'), score: Math.max(35, item('VWAP / Volume Ratio', 80, 60, 0.6, 'Depends on clean volume data.').score - volumePenalty) },
    item('RSI', 78, 45, 1, 'Readable momentum context, noisy near threshold zones.'),
    item('MACD', 76, 70, 1, 'Good transition signal, overlaps with EMA trend.'),
    item('Bollinger / Z-Score', 74, 60, 1.1, 'Helpful stretch context, can overreact during regime changes.'),
    { ...item('Volume Profile', 72, 80, 0.7, 'Coarse but useful participation map.'), score: Math.max(35, item('Volume Profile', 72, 80, 0.7, 'Coarse but useful participation map.').score - volumePenalty) },
    { ...item('OBV', 69, 60, 1, 'Directional only; absolute level is arbitrary.'), score: Math.max(35, item('OBV', 69, 60, 1, 'Directional only; absolute level is arbitrary.').score - volumePenalty) },
    item('Sharpe / Sortino', 64, 252, 1.2, 'Sample-sensitive over short daily windows.'),
    item('Hurst Exponent', 61, 252, 1.4, 'Educational, but fragile on short samples.'),
    item('Autocorrelation', 58, 252, 1.5, 'Very noisy on limited daily data.'),
    item('Confluence Score', 75, 120, 0.9, 'Useful only after overlap and category weighting are controlled.')
  ].map(row => ({ ...row, label: reliabilityLabel(row.score) }));

  return rankings.sort((a, b) => b.score - a.score);
}

function buildAgreementGroup(name: string, components: { name: string; stance: Stance; reading: string; reliability: number }[]) {
  const directional = components.filter(c => c.stance !== 'neutral');
  const supporting = directional.filter(c => c.stance === 'supporting').length;
  const conflicting = directional.filter(c => c.stance === 'conflicting').length;
  const dominant = supporting >= conflicting ? 'supporting' : 'conflicting';
  const maxSide = Math.max(supporting, conflicting);
  const score = directional.length === 0 ? 62 : Math.round((maxSide / directional.length) * 100);
  const state = score >= 75 ? 'Agreeing' : score >= 55 ? 'Mixed' : 'Disagreeing';

  let summary = `${name} models are mostly neutral.`;
  if (state === 'Agreeing' && dominant === 'supporting') {
    summary = `${name} models are broadly aligned.`;
  } else if (state === 'Agreeing' && dominant === 'conflicting') {
    summary = `${name} models are broadly cautious.`;
  } else if (state !== 'Agreeing') {
    summary = `${name} models are not fully confirming each other.`;
  }

  return {
    name,
    score,
    state,
    direction: dominant,
    components,
    summary
  };
}

function maxForwardDrawdown(closes: number[], startIdx: number, endIdx: number) {
  let peak = closes[startIdx];
  let maxDd = 0;

  for (let i = startIdx; i <= endIdx; i++) {
    peak = Math.max(peak, closes[i]);
    maxDd = Math.max(maxDd, peak === 0 ? 0 : ((peak - closes[i]) / peak) * 100);
  }

  return maxDd;
}

export function calculateUpgradedAnalytics(input: UpgradedAnalyticsInput) {
  const {
    ticker,
    closes,
    highs,
    lows,
    volumes,
    dates,
    rsi,
    macdHistogram,
    adx,
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
  } = input;

  const tLatest = closes.length - 1;
  const currentClose = closes[tLatest] || 0;
  const obv = computeOBV(closes, volumes);
  const vwapData = computeVWAP(highs, lows, closes, volumes, 20);
  const volSma20 = computeSMA(volumes, 20);

  const historicalHurst = closes.map((_, i) => (
    i < 80 ? 0.5 : calculateHurstExponent(closes.slice(i - 80, i + 1))
  ));
  const historicalER = closes.map((_, i) => (
    i < 20 ? 0.5 : calculateEfficiencyRatio(closes.slice(i - 20, i + 1), 20)
  ));
  const historicalRV = closes.map((_, i) => (
    i < 20 ? 0 : calculateRealizedVolatility(closes.slice(i - 20, i + 1), 20)
  ));
  const historicalZScore = closes.map((_, i) => (
    i < 20 ? 0 : calculateZScore(closes.slice(i - 19, i + 1), 20)
  ));
  const historicalVolumeRatio = closes.map((_, i) => {
    const avgVol = volSma20[i] || volumes[i] || 1;
    return avgVol === 0 ? 0 : volumes[i] / avgVol;
  });

  const regimes = closes.map((_, i) => computeRegime(
    historicalHurst[i],
    historicalER[i],
    adx[i] || 0,
    historicalRV[i],
    drawdown.underwaterCurve[i] || 0
  ));

  const currentRegime = regimes[tLatest] || 'Transitional';

  let consecutiveDays = 0;
  for (let i = tLatest; i >= 0; i--) {
    if (regimes[i] === currentRegime) consecutiveDays++;
    else break;
  }

  const regimeCounts = regimes.reduce((acc, regime) => {
    acc[regime] = (acc[regime] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const historicalFrequency = closes.length === 0 ? 0 : ((regimeCounts[currentRegime] || 0) / closes.length) * 100;

  const regimeTimeline = dates.map((date, i) => ({
    date: toDateKey(date),
    regime: regimes[i],
    volatility: historicalRV[i],
    trendPersistence: historicalHurst[i] * 100,
    efficiency: historicalER[i] * 100,
    drawdown: drawdown.underwaterCurve[i] || 0
  }));

  const structure = calculateStructureScore(currentClose, pivots);
  const indicatorAttribution = {
    trend: confluenceScore.trend * 0.3,
    momentum: confluenceScore.momentum * 0.25,
    volatility: confluenceScore.volatility * 0.15,
    volume: confluenceScore.volume * 0.2,
    structure: structure * 0.1
  };

  const compositeWithStructure = Object.values(indicatorAttribution).reduce((a, b) => a + b, 0);

  const compositeProxyForIndex = (idx: number) => {
    if (idx < 0) return 0;
    const rsiScore = normalizeSigned((rsi[idx] || 50) - 50, 50);
    const macdScore = normalizeSigned((macdHistogram[idx] || 0) / Math.max(closes[idx] || 1, 1) * 1000, 1);
    const adxScore = (adx[idx] || 0) > 22 ? normalizeSigned(historicalER[idx] - 0.25, 0.35) : 0;
    const volScore = normalizeSigned((historicalVolumeRatio[idx] || 1) - 1, 1);
    const riskScore = historicalRV[idx] > 30 ? -0.5 : (historicalRV[idx] < 14 ? 0.25 : 0);
    return clamp((rsiScore * 0.25) + (macdScore * 0.25) + (adxScore * 0.25) + (volScore * 0.15) + (riskScore * 0.1), -1, 1);
  };

  const getFeatureVector = (idx: number) => {
    const hist = macdHistogram[idx] || 0;
    const current = closes[idx] || 1;
    const windowStart = Math.max(0, idx - 149);
    const windowCloses = closes.slice(windowStart, idx + 1);
    const minW = Math.min(...windowCloses);
    const maxW = Math.max(...windowCloses);
    const pct = maxW === minW ? 50 : 100 * (closes[idx] - minW) / (maxW - minW);

    return [
      (rsi[idx] || 50) / 100,
      clamp((hist / current) * 50 + 0.5, 0, 1),
      clamp((adx[idx] || 0) / 100, 0, 1),
      clamp((atr[idx] || 0) / Math.max(current, 1) * 20, 0, 1),
      clamp(historicalHurst[idx], 0, 1),
      clamp(historicalER[idx], 0, 1),
      clamp(historicalRV[idx] / 100, 0, 1),
      clamp((drawdown.underwaterCurve[idx] || 0) / 100, 0, 1),
      clamp((historicalZScore[idx] + 3) / 6, 0, 1),
      pct / 100,
      clamp((historicalVolumeRatio[idx] || 0) / 5, 0, 1),
      (compositeProxyForIndex(idx) + 1) / 2
    ];
  };

  const currentVector = getFeatureVector(tLatest);
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
    const sub5dReturn = closes[i] === 0 ? 0 : ((closes[i + 5] - closes[i]) / closes[i]) * 100;
    const sub20dReturn = closes[i] === 0 ? 0 : ((closes[i + 20] - closes[i]) / closes[i]) * 100;
    const volatilityChange = historicalRV[i + 20] - historicalRV[i];
    const subsequentDrawdown = maxForwardDrawdown(closes, i, i + 20);

    analogs.push({
      date: toDateKey(dates[i]),
      similarity: similarity * 100,
      marketStructure: regimes[i],
      sub5dReturn,
      sub20dReturn,
      volatilityChange,
      subsequentDrawdown,
      outcomes: {
        returns: [
          { window: '5D', value: sub5dReturn },
          { window: '20D', value: sub20dReturn }
        ],
        volatilityChange,
        drawdown: subsequentDrawdown
      },
      breakdown: {
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
      }
    });
  }

  analogs.sort((a, b) => b.similarity - a.similarity);
  const topAnalogs = analogs.slice(0, 5);

  const prevIdx = Math.max(0, tLatest - 1);
  const dRsi = (rsi[tLatest] || 50) - (rsi[prevIdx] || 50);
  const dMacd = (macdHistogram[tLatest] || 0) - (macdHistogram[prevIdx] || 0);
  const dAdx = (adx[tLatest] || 0) - (adx[prevIdx] || 0);
  const dVol = historicalRV[tLatest] - historicalRV[prevIdx];
  const dVolumeRatio = historicalVolumeRatio[tLatest] - historicalVolumeRatio[prevIdx];
  const dConf = compositeWithStructure - compositeProxyForIndex(prevIdx);
  const dDrawdown = (drawdown.underwaterCurve[tLatest] || 0) - (drawdown.underwaterCurve[prevIdx] || 0);
  const dStructure = regimes[tLatest] === regimes[prevIdx] ? 0 : 1;

  const deltaList = [
    { name: 'RSI', val: dRsi, formatted: dRsi.toFixed(1) },
    { name: 'MACD', val: dMacd, formatted: dMacd.toFixed(4) },
    { name: 'ADX', val: dAdx, formatted: dAdx.toFixed(1) },
    { name: 'Volatility', val: dVol, formatted: `${dVol.toFixed(1)}%` },
    { name: 'Volume Ratio', val: dVolumeRatio, formatted: `${dVolumeRatio.toFixed(2)}x` },
    { name: 'Confluence', val: dConf, formatted: dConf.toFixed(2) },
    { name: 'Drawdown', val: dDrawdown, formatted: `${dDrawdown.toFixed(1)}%` },
    { name: 'Structure', val: dStructure, formatted: dStructure === 0 ? 'unchanged' : 'changed' }
  ].sort((a, b) => b.val - a.val);

  const dailyDelta = {
    biggestIncrease: deltaList[0] || null,
    biggestDecrease: deltaList[deltaList.length - 1] || null,
    deltas: {
      rsi: dRsi,
      macd: dMacd,
      adx: dAdx,
      volatility: dVol,
      volumeRatio: dVolumeRatio,
      confluence: dConf,
      drawdown: dDrawdown,
      structure: dStructure
    }
  };

  const reliabilityRankings = buildReliabilityRankings({ closes, volumes, realizedVolatility, volumeRatio });
  const reliabilityMap = reliabilityRankings.reduce((acc, row) => {
    acc[row.model] = row.score;
    return acc;
  }, {} as Record<string, number>);

  const obvSlope = obv[tLatest] - (obv[Math.max(0, tLatest - 5)] || 0);
  const vwap = vwapData.vwap[tLatest] || currentClose;
  const vwapDistancePct = vwap === 0 ? 0 : ((currentClose - vwap) / vwap) * 100;
  const volumePressure = Math.round(clamp(
    50 +
    normalizeSigned(volumeRatio - 1, 1.2) * 24 +
    scoreToStance(obvSlope, 0) === 'supporting' ? 14 : -8 +
    normalizeSigned(vwapDistancePct, 4) * 12,
    0,
    100
  ));

  const trendGroup = buildAgreementGroup('Trend', [
    { name: 'Moving-average cluster', stance: scoreToStance(confluenceScore.trend), reading: confluenceScore.trend.toFixed(2), reliability: reliabilityMap['SMA/EMA Trend'] || 75 },
    { name: 'ADX strength', stance: (adx[tLatest] || 0) > 22 ? scoreToStance(confluenceScore.trend, 0.05) : 'neutral', reading: `${(adx[tLatest] || 0).toFixed(1)}`, reliability: reliabilityMap['ADX'] || 75 },
    { name: 'Efficiency ratio', stance: scoreToStance(efficiencyRatio - 0.32, 0.08), reading: efficiencyRatio.toFixed(2), reliability: reliabilityMap['Hurst Exponent'] || 60 },
    { name: 'Hurst persistence', stance: scoreToStance(hurstExponent - 0.5, 0.05), reading: hurstExponent.toFixed(2), reliability: reliabilityMap['Hurst Exponent'] || 60 }
  ]);

  const momentumGroup = buildAgreementGroup('Momentum', [
    { name: 'RSI balance', stance: scoreToStance((rsi[tLatest] || 50) - 50, 7), reading: `${(rsi[tLatest] || 50).toFixed(1)}`, reliability: reliabilityMap['RSI'] || 70 },
    { name: 'MACD histogram', stance: scoreToStance(macdHistogram[tLatest] || 0, Math.max(currentClose * 0.0004, 0.01)), reading: `${(macdHistogram[tLatest] || 0).toFixed(3)}`, reliability: reliabilityMap['MACD'] || 70 },
    { name: 'Price stretch', stance: scoreToStance(zScore, 0.8), reading: zScore.toFixed(2), reliability: reliabilityMap['Bollinger / Z-Score'] || 70 }
  ]);

  const volumeGroup = buildAgreementGroup('Volume', [
    { name: 'Volume ratio', stance: scoreToStance(volumeRatio - 1, 0.15), reading: `${volumeRatio.toFixed(2)}x`, reliability: reliabilityMap['VWAP / Volume Ratio'] || 72 },
    { name: 'OBV slope', stance: scoreToStance(obvSlope, Math.max(Math.abs(obv[tLatest]) * 0.005, 1)), reading: obvSlope >= 0 ? 'rising' : 'falling', reliability: reliabilityMap['OBV'] || 65 },
    { name: 'VWAP position', stance: scoreToStance(vwapDistancePct, 0.75), reading: `${vwapDistancePct.toFixed(2)}%`, reliability: reliabilityMap['VWAP / Volume Ratio'] || 72 }
  ]);

  const volatilityGroup = buildAgreementGroup('Volatility', [
    { name: 'Realized volatility', stance: realizedVolatility > 30 ? 'conflicting' : (realizedVolatility < 16 ? 'supporting' : 'neutral'), reading: `${realizedVolatility.toFixed(1)}%`, reliability: reliabilityMap['Realized Volatility'] || 80 },
    { name: 'Drawdown depth', stance: drawdown.currentDrawdown > 10 ? 'conflicting' : (drawdown.currentDrawdown < 4 ? 'supporting' : 'neutral'), reading: `${drawdown.currentDrawdown.toFixed(1)}%`, reliability: reliabilityMap['Drawdown Analytics'] || 85 },
    { name: 'ATR pressure', stance: (atr[tLatest] || 0) / Math.max(currentClose, 1) > 0.035 ? 'conflicting' : 'neutral', reading: `${(((atr[tLatest] || 0) / Math.max(currentClose, 1)) * 100).toFixed(2)}%`, reliability: reliabilityMap['ATR'] || 78 }
  ]);

  const groups = [trendGroup, momentumGroup, volumeGroup, volatilityGroup];
  const overallAgreement = Math.round(average(groups.map(g => g.score)));
  const disagreements = groups
    .filter(g => g.state !== 'Agreeing')
    .map(g => g.summary);

  const modelAgreement = {
    overallAgreement,
    groups,
    disagreements,
    narrative: disagreements.length > 0
      ? disagreements.join(' ')
      : 'Trend, momentum, volume, and volatility models are broadly confirming one another.'
  };

  const stabilityFactor = Math.min(100, consecutiveDays * 12);
  const sufficiencyFactor = clamp((closes.length / 252) * 100);
  const volConsistencyFactor = clamp(100 - Math.max(0, realizedVolatility - 12) * 2.2);
  const reliabilityFactor = Math.round(average(reliabilityRankings.slice(0, 10).map(row => row.score)));

  const confidenceScoreVal = Math.round(
    (overallAgreement * 0.3) +
    (stabilityFactor * 0.2) +
    (sufficiencyFactor * 0.2) +
    (volConsistencyFactor * 0.15) +
    (reliabilityFactor * 0.15)
  );

  const confidenceScore = {
    score: confidenceScoreVal,
    factors: {
      agreement: overallAgreement,
      stability: stabilityFactor,
      sufficiency: sufficiencyFactor,
      volatility: volConsistencyFactor,
      reliability: reliabilityFactor
    }
  };

  const computeReturn = (tickerCloses: number[], days: number) => {
    if (tickerCloses.length < days + 1) return 0;
    const cur = tickerCloses[tickerCloses.length - 1];
    const prev = tickerCloses[tickerCloses.length - 1 - days];
    return prev === 0 ? 0 : ((cur - prev) / prev) * 100;
  };

  const ret5d = computeReturn(closes, 5);
  const ret20d = computeReturn(closes, 20);
  const ret60d = computeReturn(closes, 60);
  const ret120d = computeReturn(closes, 120);
  const returnsBySymbol: Record<string, Record<number, number>> = {};

  for (const sym of Object.keys(allGroupedCandles)) {
    const symCloses = allGroupedCandles[sym].map(c => c.close);
    returnsBySymbol[sym] = {
      5: computeReturn(symCloses, 5),
      20: computeReturn(symCloses, 20),
      60: computeReturn(symCloses, 60),
      120: computeReturn(symCloses, 120)
    };
  }

  const getPercentileRank = (val: number, window: number) => {
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

  const curMetadata = NIFTY_50_METADATA[ticker] || NIFTY_50_METADATA[ticker + '.NS'] || { sector: 'Other' };
  const sector = curMetadata.sector;
  const sectorPeers = Object.keys(NIFTY_50_METADATA).filter(s => NIFTY_50_METADATA[s].sector === sector && s !== ticker);

  const getSectorAvg = (window: number) => {
    const peerVals = sectorPeers.map(s => returnsBySymbol[s]?.[window] || 0);
    return peerVals.length === 0 ? 0 : average(peerVals);
  };

  const relativeStrength = {
    performance: {
      5: ret5d,
      20: ret20d,
      60: ret60d,
      120: ret120d
    },
    percentiles: relStrengthRanks,
    sectorComparison: {
      sectorName: sector,
      avg5d: getSectorAvg(5),
      avg20d: getSectorAvg(20),
      avg60d: getSectorAvg(60),
      avg120d: getSectorAvg(120)
    }
  };

  const avgRS = average([
    relStrengthRanks.rank5d,
    relStrengthRanks.rank20d,
    relStrengthRanks.rank60d,
    relStrengthRanks.rank120d
  ]);

  const curVol = volumes[tLatest];
  const allVols = Object.keys(allGroupedCandles).map(s => {
    const len = allGroupedCandles[s].length;
    return len > 0 ? allGroupedCandles[s][len - 1].volume : 0;
  });
  const lowerVols = allVols.filter(v => v < curVol).length;
  const volRank = allVols.length === 0 ? 50 : (lowerVols / allVols.length) * 100;

  const marketDNA = {
    trendPersistence: clamp((adx[tLatest] || 20) * 2.5),
    momentum: clamp(rsi[tLatest] || 50),
    volatility: clamp(100 - realizedVolatility * 2.5),
    liquidity: volRank,
    participation: clamp(volumeRatio * 40),
    drawdownStability: clamp(100 - drawdown.maxDrawdown),
    relativeStrength: avgRS
  };

  const priceBehaviour = {
    persistence: Math.round(clamp((hurstExponent * 42) + (efficiencyRatio * 58))),
    strength: Math.round(clamp((adx[tLatest] || 0) * 2.5)),
    consistency: trendGroup.score,
    recentChange: dConf,
    contributions: [
      { name: 'Trend cluster', value: indicatorAttribution.trend, reliability: reliabilityMap['SMA/EMA Trend'] || 75 },
      { name: 'Momentum', value: indicatorAttribution.momentum, reliability: reliabilityMap['RSI'] || 70 },
      { name: 'Volatility context', value: indicatorAttribution.volatility, reliability: reliabilityMap['Realized Volatility'] || 80 },
      { name: 'Volume confirmation', value: indicatorAttribution.volume, reliability: reliabilityMap['VWAP / Volume Ratio'] || 72 },
      { name: 'Structure', value: indicatorAttribution.structure, reliability: reliabilityMap['Confluence Score'] || 70 }
    ]
  };

  const volumeBehaviour = {
    pressure: volumePressure,
    participationTrend: dates.slice(Math.max(0, tLatest - 29), tLatest + 1).map((date, offset) => {
      const idx = Math.max(0, tLatest - 29) + offset;
      return {
        date: toDateKey(date),
        ratio: historicalVolumeRatio[idx],
        volume: volumes[idx]
      };
    }),
    context: {
      volumeRatio,
      obvSlope,
      vwapDistancePct,
      participationRank: volRank,
      pointOfControlDistance: 0
    }
  };

  return {
    historicalAnalogs: topAnalogs,
    indicatorAttribution,
    compositeConfluence: compositeWithStructure,
    regimeDetection: {
      currentRegime,
      daysSpent: consecutiveDays,
      historicalFrequency,
      timeline: regimeTimeline
    },
    dailyDelta,
    confidenceScore,
    relativeStrength,
    marketDNA,
    modelReliability: reliabilityRankings,
    modelAgreement,
    regimeTimeline,
    priceBehaviour,
    volumeBehaviour
  };
}
