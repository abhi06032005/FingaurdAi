import { calculateAllTrendIndicators, TrendIndicatorResult } from './trendIndicators';
import { calculateAllMomentumIndicators, MomentumIndicatorResult } from './momentumIndicators';
import { calculateAllVolatilityIndicators, VolatilityIndicatorResult } from './volatilityIndicators';
import { calculateAllVolumeIndicators, VolumeIndicatorResult } from './volumeIndicators';
import { detectDivergences, DivergenceResult } from './divergenceDetector';
import { RSI, MACD } from 'technicalindicators';

export interface AllIndicatorResults {
  trend: TrendIndicatorResult;
  momentum: MomentumIndicatorResult;
  volatility: VolatilityIndicatorResult;
  volume: VolumeIndicatorResult;
  divergences: DivergenceResult[];
}

export interface CandleLike {
  close: number;
  high: number;
  low: number;
  volume: number | bigint;
}

/**
 * Orchestrates the calculations of all indicators.
 * @param candles List of candles, sorted chronologically (oldest to newest).
 */
export function calculateAllIndicators(candles: CandleLike[]): AllIndicatorResults {
  const closes = candles.map(c => Number(c.close));
  const highs = candles.map(c => Number(c.high));
  const lows = candles.map(c => Number(c.low));
  const volumes = candles.map(c => Number(c.volume));

  // Run the indicator calculators
  const trend = calculateAllTrendIndicators(highs, lows, closes);
  const momentum = calculateAllMomentumIndicators(closes);
  const volatility = calculateAllVolatilityIndicators(highs, lows, closes);
  const volume = calculateAllVolumeIndicators(closes, volumes);

  // For divergence detector, we need historical arrays of RSI and MACD Histogram.
  let divergences: DivergenceResult[] = [];
  if (closes.length >= 14) {
    const fullRsi = RSI.calculate({ period: 14, values: closes });
    const macdCalc = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const fullMacdHist = macdCalc.map(m => m.histogram ?? 0);

    divergences = detectDivergences(closes, fullRsi, fullMacdHist, 14);
  }

  return {
    trend,
    momentum,
    volatility,
    volume,
    divergences
  };
}
