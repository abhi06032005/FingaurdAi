import { round } from '../../utils/mathUtils';

export interface DivergenceResult {
  type: 'bullish_rsi' | 'bearish_rsi' | 'bullish_macd' | 'bearish_macd';
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

/**
 * Detects divergences between price closes and indicators (RSI / MACD histogram).
 */
export function detectDivergences(
  closes: number[],
  rsiValues: number[],
  macdHistogram: number[],
  lookback = 14
): DivergenceResult[] {
  const divergences: DivergenceResult[] = [];
  const n = closes.length;

  // Ensure we have enough data points
  if (n < lookback + 2) return divergences;

  // Create aligned arrays representing the last (lookback + 1) periods
  const alignedCloses = closes.slice(-(lookback + 1));
  const alignedRsi = rsiValues.slice(-(lookback + 1));
  const alignedMacd = macdHistogram.slice(-(lookback + 1));

  if (alignedCloses.length < lookback + 1) return divergences;

  const currentIdx = alignedCloses.length - 1;
  const currentClose = alignedCloses[currentIdx];

  // Find index of the lowest close in the lookback window (excluding current)
  let minCloseIdx = 0;
  for (let i = 1; i < currentIdx; i++) {
    if (alignedCloses[i] < alignedCloses[minCloseIdx]) {
      minCloseIdx = i;
    }
  }

  // Find index of the highest close in the lookback window (excluding current)
  let maxCloseIdx = 0;
  for (let i = 1; i < currentIdx; i++) {
    if (alignedCloses[i] > alignedCloses[maxCloseIdx]) {
      maxCloseIdx = i;
    }
  }

  // --- RSI DIVERGENCES ---
  if (alignedRsi.length === alignedCloses.length) {
    const currentRsi = alignedRsi[currentIdx];
    const minCloseRsi = alignedRsi[minCloseIdx];
    const maxCloseRsi = alignedRsi[maxCloseIdx];

    if (currentRsi !== null && minCloseRsi !== null && maxCloseRsi !== null) {
      // 1. Bullish RSI Divergence: Price makes lower low, RSI makes higher low
      if (currentClose < alignedCloses[minCloseIdx] && currentRsi > minCloseRsi) {
        const rsiGap = currentRsi - minCloseRsi;
        const strength = rsiGap > 10 ? 'strong' : rsiGap > 5 ? 'moderate' : 'weak';
        divergences.push({
          type: 'bullish_rsi',
          strength,
          description: `Price recorded a lower low, but the RSI value formed a higher low (from ${round(minCloseRsi, 1)} to ${round(currentRsi, 1)}), indicating weakening downward momentum.`
        });
      }

      // 2. Bearish RSI Divergence: Price makes higher high, RSI makes lower high
      if (currentClose > alignedCloses[maxCloseIdx] && currentRsi < maxCloseRsi) {
        const rsiGap = maxCloseRsi - currentRsi;
        const strength = rsiGap > 10 ? 'strong' : rsiGap > 5 ? 'moderate' : 'weak';
        divergences.push({
          type: 'bearish_rsi',
          strength,
          description: `Price recorded a higher high, but the RSI value formed a lower high (from ${round(maxCloseRsi, 1)} to ${round(currentRsi, 1)}), indicating weakening upward momentum.`
        });
      }
    }
  }

  // --- MACD DIVERGENCES ---
  if (alignedMacd.length === alignedCloses.length) {
    const currentMacd = alignedMacd[currentIdx];
    const minCloseMacd = alignedMacd[minCloseIdx];
    const maxCloseMacd = alignedMacd[maxCloseIdx];

    if (currentMacd !== null && minCloseMacd !== null && maxCloseMacd !== null) {
      // 3. Bullish MACD Divergence: Price makes lower low, MACD histogram makes higher low
      if (currentClose < alignedCloses[minCloseIdx] && currentMacd > minCloseMacd) {
        const macdGap = currentMacd - minCloseMacd;
        const strength = macdGap > 0.5 ? 'strong' : macdGap > 0.2 ? 'moderate' : 'weak';
        divergences.push({
          type: 'bullish_macd',
          strength,
          description: `Price recorded a lower low, but the MACD histogram formed a higher low (from ${round(minCloseMacd, 2)} to ${round(currentMacd, 2)}), suggesting downward momentum is decelerating.`
        });
      }

      // 4. Bearish MACD Divergence: Price makes higher high, MACD histogram makes lower high
      if (currentClose > alignedCloses[maxCloseIdx] && currentMacd < maxCloseMacd) {
        const macdGap = maxCloseMacd - currentMacd;
        const strength = macdGap > 0.5 ? 'strong' : macdGap > 0.2 ? 'moderate' : 'weak';
        divergences.push({
          type: 'bearish_macd',
          strength,
          description: `Price recorded a higher high, but the MACD histogram formed a lower high (from ${round(maxCloseMacd, 2)} to ${round(currentMacd, 2)}), suggesting upward momentum is decelerating.`
        });
      }
    }
  }

  return divergences;
}
