import { RSI, MACD, StochasticRSI } from 'technicalindicators';

export interface RSIResult {
  value: number;
  slope: 'rising' | 'falling' | 'flat';
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  crossoverDetected: boolean;
  crossoverDirection: 'bullish' | 'bearish' | 'none';
  histogramExpanding: boolean;
  histogramContracting: boolean;
}

export interface StochRSIResult {
  k: number;
  d: number;
  crossover: 'bullish' | 'bearish' | 'none';
}

export interface MomentumIndicatorResult {
  rsi: RSIResult | null;
  macd: MACDResult | null;
  stochasticRsi: StochRSIResult | null;
}

export function calculateRSI(closes: number[], period = 14): RSIResult | null {
  if (closes.length <= period) return null;
  const result = RSI.calculate({ period, values: closes });
  if (result.length === 0) return null;
  
  const value = result[result.length - 1];
  let slope: 'rising' | 'falling' | 'flat' = 'flat';
  
  if (result.length >= 5) {
    const diff = result[result.length - 1] - result[result.length - 5];
    if (diff > 0.5) {
      slope = 'rising';
    } else if (diff < -0.5) {
      slope = 'falling';
    }
  } else if (result.length >= 2) {
    const diff = result[result.length - 1] - result[result.length - 2];
    if (diff > 0.1) {
      slope = 'rising';
    } else if (diff < -0.1) {
      slope = 'falling';
    }
  }

  return { value, slope };
}

export function calculateMACD(closes: number[]): MACDResult | null {
  if (closes.length < 35) return null;

  const result = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  if (result.length < 2) return null;

  const curr = result[result.length - 1];
  const prev = result[result.length - 2];

  if (curr.MACD === undefined || curr.signal === undefined || curr.histogram === undefined ||
      prev.MACD === undefined || prev.signal === undefined || prev.histogram === undefined) {
    return null;
  }

  let crossoverDetected = false;
  let crossoverDirection: 'bullish' | 'bearish' | 'none' = 'none';

  if (prev.histogram <= 0 && curr.histogram > 0) {
    crossoverDetected = true;
    crossoverDirection = 'bullish';
  } else if (prev.histogram >= 0 && curr.histogram < 0) {
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

export function calculateStochasticRSI(closes: number[]): StochRSIResult | null {
  if (closes.length < 34) return null;

  const result = StochasticRSI.calculate({
    values: closes,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3,
  });

  if (result.length < 2) return null;

  const curr = result[result.length - 1];
  const prev = result[result.length - 2];

  if (curr.k === undefined || curr.d === undefined || prev.k === undefined || prev.d === undefined) {
    return null;
  }

  let crossover: 'bullish' | 'bearish' | 'none' = 'none';
  if (prev.k <= prev.d && curr.k > curr.d) {
    crossover = 'bullish';
  } else if (prev.k >= prev.d && curr.k < curr.d) {
    crossover = 'bearish';
  }

  return {
    k: curr.k,
    d: curr.d,
    crossover,
  };
}

export function calculateAllMomentumIndicators(closes: number[]): MomentumIndicatorResult {
  return {
    rsi: calculateRSI(closes, 14),
    macd: calculateMACD(closes),
    stochasticRsi: calculateStochasticRSI(closes),
  };
}
