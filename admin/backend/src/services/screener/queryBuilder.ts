import { ScreenerFilter } from './aiQueryParser';

// ─── Field mapping: filter key → Prisma StockMetrics field ───────────────────

const NUMERIC_FIELD_MAP: Record<string, string> = {
  change_pct: 'changePct',
  volume_ratio: 'volumeRatio',
  rsi14: 'rsi14',
  sma20: 'sma20',
  sma50: 'sma50',
  sma100: 'sma100',
  sma200: 'sma200',
  ema20: 'ema20',
  ema50: 'ema50',
  ema100: 'ema100',
  ema200: 'ema200',
};

const BOOLEAN_FIELD_MAP: Record<string, string> = {
  above_sma20: 'aboveSma20',
  above_sma50: 'aboveSma50',
  above_sma100: 'aboveSma100',
  above_sma200: 'aboveSma200',
  above_ema20: 'aboveEma20',
  above_ema50: 'aboveEma50',
  above_ema100: 'aboveEma100',
  above_ema200: 'aboveEma200',
  crossover_20_50: 'crossover2050',
  crossover_50_100: 'crossover50100',
  crossover_50_200: 'crossover50200',
  bullish_macd_cross: 'bullishMacdCross',
  bearish_macd_cross: 'bearishMacdCross',
  new_52w_high: 'new52wHigh',
  new_52w_low: 'new52wLow',
};

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Converts a ScreenerFilter JSON object into a Prisma WHERE object.
 * All fields are validated against whitelists before inclusion.
 * Returns a plain object compatible with prisma.stockMetrics.findMany({ where: ... })
 */
export function buildPrismaWhereClause(filter: ScreenerFilter): Record<string, any> {
  const where: Record<string, any> = {};

  for (const [rawKey, rawValue] of Object.entries(filter)) {
    // ── Boolean flags ────────────────────────────────────────────────────────
    if (rawKey in BOOLEAN_FIELD_MAP) {
      if (typeof rawValue === 'boolean') {
        where[BOOLEAN_FIELD_MAP[rawKey]] = rawValue;
      }
      continue;
    }

    // ── String filters ───────────────────────────────────────────────────────
    if (rawKey === 'sector' && typeof rawValue === 'string') {
      where.sector = { equals: rawValue, mode: 'insensitive' };
      continue;
    }

    if (rawKey === 'market_cap_category' && typeof rawValue === 'string') {
      where.marketCapCategory = { equals: rawValue, mode: 'insensitive' };
      continue;
    }

    // ── Numeric range filters ────────────────────────────────────────────────
    if (rawKey in NUMERIC_FIELD_MAP && typeof rawValue === 'object' && rawValue !== null) {
      const prismaField = NUMERIC_FIELD_MAP[rawKey];
      const op = rawValue as Record<string, any>;
      const prismaOp: Record<string, any> = {};

      if (typeof op.gt === 'number') prismaOp.gt = op.gt;
      if (typeof op.gte === 'number') prismaOp.gte = op.gte;
      if (typeof op.lt === 'number') prismaOp.lt = op.lt;
      if (typeof op.lte === 'number') prismaOp.lte = op.lte;
      if (typeof op.equals === 'number') prismaOp.equals = op.equals;

      // between: [min, max] → gte + lte
      if (Array.isArray(op.between) && op.between.length === 2) {
        prismaOp.gte = op.between[0];
        prismaOp.lte = op.between[1];
      }

      if (Object.keys(prismaOp).length > 0) {
        where[prismaField] = prismaOp;
      }
    }
  }

  return where;
}

/**
 * Generates a human-readable filter description for display/debug.
 */
export function describeFilter(filter: ScreenerFilter): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(filter)) {
    if (key in BOOLEAN_FIELD_MAP) {
      parts.push(`${key} = ${value}`);
    } else if (key === 'sector' || key === 'market_cap_category') {
      parts.push(`${key} = "${value}"`);
    } else if (typeof value === 'object' && value !== null) {
      const op = value as Record<string, any>;
      if (op.between) {
        parts.push(`${key} BETWEEN ${op.between[0]} AND ${op.between[1]}`);
      } else {
        const conditions = Object.entries(op).map(([k, v]) => `${key} ${k} ${v}`);
        parts.push(conditions.join(' AND '));
      }
    }
  }

  return parts.length > 0 ? parts.join(' AND ') : '(no filters)';
}
