/**
 * normalize.ts
 * Shared pattern normalization utilities for pattern search.
 */

/**
 * Linearly resample an array of numbers to exactly `targetLength` points.
 * Uses linear interpolation between adjacent samples.
 */
export function resampleTo(series: number[], targetLength: number): number[] {
  if (series.length === 0) return new Array(targetLength).fill(0);
  if (series.length === 1) return new Array(targetLength).fill(series[0]);
  if (series.length === targetLength) return [...series];

  const result: number[] = new Array(targetLength);
  const step = (series.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const pos = i * step;
    const lo = Math.floor(pos);
    const hi = Math.min(Math.ceil(pos), series.length - 1);
    const t = pos - lo;
    result[i] = series[lo] * (1 - t) + series[hi] * t;
  }

  return result;
}

/**
 * Min-max normalize an array to [0, 1].
 * If all values are the same, returns array of 0.5.
 */
export function minMaxNormalize(series: number[]): number[] {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;

  if (range === 0) return series.map(() => 0.5);
  return series.map(v => (v - min) / range);
}

/**
 * Full pipeline: resample to 100 points, then min-max normalize.
 * Returns exactly 100 normalized float values in [0, 1].
 */
export function normalizePattern(closes: number[]): number[] {
  const resampled = resampleTo(closes, 100);
  return minMaxNormalize(resampled);
}
