import { SMA, EMA, ADX } from 'technicalindicators';

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
}

export interface TrendIndicatorResult {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  adx: ADXResult | null;
}

export function calculateSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const result = SMA.calculate({ period, values: closes });
  return result.length > 0 ? result[result.length - 1] : null;
}

export function calculateEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const result = EMA.calculate({ period, values: closes });
  return result.length > 0 ? result[result.length - 1] : null;
}

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): ADXResult | null {
  if (closes.length < period * 2) return null;
  
  try {
    const result = ADX.calculate({
      period,
      high: highs,
      low: lows,
      close: closes
    });

    if (result.length === 0) return null;

    const curr = result[result.length - 1];
    if (curr.adx === undefined || curr.pdi === undefined || curr.mdi === undefined) {
      return null;
    }

    return {
      adx: curr.adx,
      plusDI: curr.pdi,
      minusDI: curr.mdi
    };
  } catch (error) {
    return null;
  }
}

export function calculateAllTrendIndicators(
  highs: number[],
  lows: number[],
  closes: number[]
): TrendIndicatorResult {
  return {
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200),
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    ema200: calculateEMA(closes, 200),
    adx: calculateADX(highs, lows, closes, 14),
  };
}
