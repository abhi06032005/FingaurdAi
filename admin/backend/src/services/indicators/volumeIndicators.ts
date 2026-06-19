import { OBV } from 'technicalindicators';

export interface OBVResult {
  obv: number;
  slope: 'rising' | 'falling' | 'flat';
}

export interface VolumeIndicatorResult {
  obv: OBVResult | null;
}

export function calculateOBV(closes: number[], volumes: number[]): OBVResult | null {
  if (closes.length < 2 || volumes.length < 2) return null;

  const result = OBV.calculate({
    close: closes,
    volume: volumes
  });

  if (result.length === 0) return null;

  const obv = result[result.length - 1];

  // Needs at least 20 periods of OBV to compare for slope
  const period = Math.min(20, result.length);
  const recentObv = result.slice(-period);
  const sum = recentObv.reduce((a, b) => a + b, 0);
  const avgObv20 = sum / period;

  const diff = obv - avgObv20;
  const absAvg = Math.abs(avgObv20);
  const threshold = absAvg * 0.0001; // 0.01% tolerance

  let slope: 'rising' | 'falling' | 'flat' = 'flat';
  if (diff > threshold) {
    slope = 'rising';
  } else if (diff < -threshold) {
    slope = 'falling';
  }

  return {
    obv,
    slope
  };
}

export function calculateAllVolumeIndicators(closes: number[], volumes: number[]): VolumeIndicatorResult {
  return {
    obv: calculateOBV(closes, volumes)
  };
}
