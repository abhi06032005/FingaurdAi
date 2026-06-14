import { logger } from '../../utils/logger';

export interface RawCandle {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ValidationResult {
  valid: boolean;
  qualityScore: number;
  reason?: string;
}

/**
 * Validates raw candle data and assigns a quality score between 0 and 100.
 */
export function validateCandle(candle: RawCandle): ValidationResult {
  let score = 100;
  const reasons: string[] = [];

  // Check 1: No null or NaN values
  const hasNanOrNull =
    isNaN(candle.open) || candle.open === null ||
    isNaN(candle.high) || candle.high === null ||
    isNaN(candle.low) || candle.low === null ||
    isNaN(candle.close) || candle.close === null ||
    isNaN(candle.volume) || candle.volume === null;

  if (hasNanOrNull) {
    score -= 100;
    reasons.push('Contains null or NaN values');
    logger.warn('Candle validation failed: null/NaN fields', { symbol: candle.symbol, date: candle.date });
    return { valid: false, qualityScore: 0, reason: reasons.join(', ') };
  }

  // Check 2: high >= low
  if (candle.high < candle.low) {
    score -= 25;
    reasons.push(`High (${candle.high}) is lower than low (${candle.low})`);
  }

  // Check 3: close is within [low, high]
  if (candle.close < candle.low || candle.close > candle.high) {
    score -= 25;
    reasons.push(`Close (${candle.close}) is outside range [${candle.low}, ${candle.high}]`);
  }

  // Check 4: open is within [low * 0.9, high * 1.1]
  const minAllowedOpen = candle.low * 0.9;
  const maxAllowedOpen = candle.high * 1.1;
  if (candle.open < minAllowedOpen || candle.open > maxAllowedOpen) {
    score -= 25;
    reasons.push(`Open (${candle.open}) is outside 10% gap tolerance [${minAllowedOpen.toFixed(2)}, ${maxAllowedOpen.toFixed(2)}]`);
  }

  // Check 5: volume > 0
  if (candle.volume <= 0) {
    score -= 25;
    reasons.push(`Volume (${candle.volume}) is less than or equal to 0`);
  }

  const valid = score >= 60;
  const reason = reasons.length > 0 ? reasons.join('; ') : undefined;

  if (!valid) {
    logger.error(`Rejected candle or low quality candle for ${candle.symbol} on ${candle.date.toISOString().split('T')[0]}: ${reason}`);
  }

  return { valid, qualityScore: score, reason };
}
