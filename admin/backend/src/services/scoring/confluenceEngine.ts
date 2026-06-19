import { Signal } from '../signals/signalEngine';
import { round } from '../../utils/mathUtils';

/**
 * Calculates the percentage of signals in agreement (either bullish or bearish).
 * @param signals List of generated signals.
 */
export function calculateConfluence(signals: Signal[]): number {
  if (signals.length === 0) return 0;

  let bullishCount = 0;
  let bearishCount = 0;

  for (const s of signals) {
    if (s.direction === 'bullish') {
      bullishCount++;
    } else if (s.direction === 'bearish') {
      bearishCount++;
    }
  }

  const maxAgreement = Math.max(bullishCount, bearishCount);
  const confluenceScore = (maxAgreement / signals.length) * 100;

  return round(confluenceScore, 1);
}
