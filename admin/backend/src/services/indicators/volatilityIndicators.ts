import { BollingerBands, ATR } from 'technicalindicators';

export interface BBResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  bandwidthState: 'contracting' | 'expanding' | 'flat';
}

export interface VolatilityIndicatorResult {
  bollingerBands: BBResult | null;
  atr: number | null;
}

export function calculateBollingerBands(closes: number[], period = 20, stdDev = 2): BBResult | null {
  if (closes.length < period) return null;

  const result = BollingerBands.calculate({
    period,
    values: closes,
    stdDev
  });

  if (result.length < 2) {
    if (result.length === 1) {
      const curr = result[0];
      const lastClose = closes[closes.length - 1];
      if (curr.upper === undefined || curr.middle === undefined || curr.lower === undefined) return null;
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

  let bandwidthState: 'contracting' | 'expanding' | 'flat' = 'flat';
  if (diff < -threshold) {
    bandwidthState = 'contracting';
  } else if (diff > threshold) {
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

export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  if (highs.length < period || lows.length < period || closes.length < period) {
    return null;
  }

  const result = ATR.calculate({
    period,
    high: highs,
    low: lows,
    close: closes
  });

  return result.length > 0 ? result[result.length - 1] : null;
}

export function calculateAllVolatilityIndicators(
  highs: number[],
  lows: number[],
  closes: number[]
): VolatilityIndicatorResult {
  return {
    bollingerBands: calculateBollingerBands(closes, 20, 2),
    atr: calculateATR(highs, lows, closes, 14),
  };
}
