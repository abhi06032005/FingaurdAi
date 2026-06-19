import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScreenerResultRow {
  symbol: string;
  companyName: string;
  sector: string;
  marketCapCategory: string;

  closePrice: number;
  changePct: number;
  volumeRatio: number;
  rsi14: number | null;

  sma20: number | null;
  sma50: number | null;
  sma100: number | null;
  sma200: number | null;

  ema20: number | null;
  ema50: number | null;

  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;

  aboveSma20: boolean;
  aboveSma50: boolean;
  aboveSma100: boolean;
  aboveSma200: boolean;

  bullishMacdCross: boolean;
  bearishMacdCross: boolean;
  new52wHigh: boolean;
  new52wLow: boolean;

  week52High: number | null;
  week52Low: number | null;
  distanceFrom52wHigh: number | null;

  volumeToday: number;
  avgVolume20: number;

  // Derived
  relevanceScore: number;
  trendLabel: 'bullish' | 'bearish' | 'neutral';
  tags: string[];
}

// ─── Raw DB row (snake_case from PostgreSQL) ──────────────────────────────────

type RawRow = {
  symbol: string;
  company_name: string;
  sector: string;
  market_cap_category: string;
  close_price: string | number;
  change_pct: string | number;
  volume_ratio: string | number;
  rsi14: string | number | null;
  sma20: string | number | null;
  sma50: string | number | null;
  sma100: string | number | null;
  sma200: string | number | null;
  ema20: string | number | null;
  ema50: string | number | null;
  macd: string | number | null;
  macd_signal: string | number | null;
  macd_histogram: string | number | null;
  above_sma20: boolean;
  above_sma50: boolean;
  above_sma100: boolean;
  above_sma200: boolean;
  bullish_macd_cross: boolean;
  bearish_macd_cross: boolean;
  new52w_high: boolean;
  new52w_low: boolean;
  week52_high: string | number | null;
  week52_low: string | number | null;
  distance_from52w_high: string | number | null;
  volume_today: string | number;
  avg_volume20: string | number;
  crossover2050: boolean;
  crossover50100: boolean;
  crossover50200: boolean;
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeRelevanceScore(row: RawRow): number {
  let score = 0;
  const rsi = row.rsi14 !== null ? Number(row.rsi14) : 50;
  if (rsi < 30) score += 20;
  else if (rsi < 40) score += 10;
  else if (rsi > 70) score += 15;
  else if (rsi > 60) score += 8;

  const volRatio = Number(row.volume_ratio);
  if (volRatio >= 3) score += 25;
  else if (volRatio >= 2) score += 15;
  else if (volRatio >= 1.5) score += 8;

  if (row.new52w_high) score += 20;
  if (row.new52w_low) score += 10;
  if (row.bullish_macd_cross) score += 18;
  if (row.bearish_macd_cross) score += 12;
  if (row.above_sma200) score += 5;
  if (row.above_sma100) score += 4;
  if (row.above_sma50) score += 3;
  if (row.above_sma20) score += 3;
  if (row.crossover2050) score += 15;
  if (row.crossover50100) score += 18;
  if (row.crossover50200) score += 20;

  const dist = row.distance_from52w_high !== null ? Number(row.distance_from52w_high) : 100;
  if (dist < 2) score += 10;
  else if (dist < 5) score += 5;
  else if (dist < 10) score += 2;

  const chg = Number(row.change_pct);
  if (Math.abs(chg) > 5) score += 8;
  else if (Math.abs(chg) > 3) score += 4;

  return Math.round(score);
}

function deriveTrendLabel(row: RawRow): 'bullish' | 'bearish' | 'neutral' {
  const bulls = [row.above_sma20, row.above_sma50, row.above_sma100, row.above_sma200].filter(Boolean).length;
  if (bulls >= 3 || row.bullish_macd_cross) return 'bullish';
  if (bulls <= 1 || row.bearish_macd_cross) return 'bearish';
  return 'neutral';
}

function deriveTags(row: RawRow): string[] {
  const tags: string[] = [];
  if (row.new52w_high) tags.push('52W High');
  if (row.new52w_low) tags.push('52W Low');
  if (Number(row.volume_ratio) >= 2) tags.push('Volume Spike');
  if (row.bullish_macd_cross) tags.push('MACD Bullish');
  if (row.bearish_macd_cross) tags.push('MACD Bearish');
  if (row.crossover2050) tags.push('20/50 Cross');
  if (row.crossover50100) tags.push('50/100 Cross');
  if (row.crossover50200) tags.push('Golden Cross');
  const rsi = row.rsi14 !== null ? Number(row.rsi14) : 50;
  if (rsi < 30) tags.push('RSI Oversold');
  else if (rsi > 70) tags.push('RSI Overbought');
  if (Number(row.change_pct) >= 5) tags.push('Big Gainer');
  else if (Number(row.change_pct) <= -5) tags.push('Big Loser');
  return tags;
}

function mapRow(row: RawRow): ScreenerResultRow {
  return {
    symbol: row.symbol,
    companyName: row.company_name,
    sector: row.sector,
    marketCapCategory: row.market_cap_category,
    closePrice: Number(row.close_price),
    changePct: Number(row.change_pct),
    volumeRatio: Number(row.volume_ratio),
    rsi14: row.rsi14 !== null ? Number(row.rsi14) : null,
    sma20: row.sma20 !== null ? Number(row.sma20) : null,
    sma50: row.sma50 !== null ? Number(row.sma50) : null,
    sma100: row.sma100 !== null ? Number(row.sma100) : null,
    sma200: row.sma200 !== null ? Number(row.sma200) : null,
    ema20: row.ema20 !== null ? Number(row.ema20) : null,
    ema50: row.ema50 !== null ? Number(row.ema50) : null,
    macd: row.macd !== null ? Number(row.macd) : null,
    macdSignal: row.macd_signal !== null ? Number(row.macd_signal) : null,
    macdHistogram: row.macd_histogram !== null ? Number(row.macd_histogram) : null,
    aboveSma20: Boolean(row.above_sma20),
    aboveSma50: Boolean(row.above_sma50),
    aboveSma100: Boolean(row.above_sma100),
    aboveSma200: Boolean(row.above_sma200),
    bullishMacdCross: Boolean(row.bullish_macd_cross),
    bearishMacdCross: Boolean(row.bearish_macd_cross),
    new52wHigh: Boolean(row.new52w_high),
    new52wLow: Boolean(row.new52w_low),
    week52High: row.week52_high !== null ? Number(row.week52_high) : null,
    week52Low: row.week52_low !== null ? Number(row.week52_low) : null,
    distanceFrom52wHigh: row.distance_from52w_high !== null ? Number(row.distance_from52w_high) : null,
    volumeToday: Number(row.volume_today),
    avgVolume20: Number(row.avg_volume20),
    relevanceScore: computeRelevanceScore(row),
    trendLabel: deriveTrendLabel(row),
    tags: deriveTags(row),
  };
}

// ─── SQL WHERE builder ────────────────────────────────────────────────────────

/**
 * Converts the Prisma-style where clause object (from queryBuilder.ts)
 * into a raw SQL WHERE clause string + parameter array.
 * Uses numbered placeholders ($1, $2 ...) for Neon/PostgreSQL.
 */
export function buildSqlWhere(where: Record<string, any>): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  // Map camelCase Prisma fields to camelCase SQL columns (which exist in DB)
  const fieldMap: Record<string, string> = {
    changePct: 'changePct',
    volumeRatio: 'volumeRatio',
    rsi14: 'rsi14',
    sma20: 'sma20',
    sma50: 'sma50',
    sma100: 'sma100',
    sma200: 'sma200',
    ema20: 'ema20',
    ema50: 'ema50',
    ema100: 'ema100',
    ema200: 'ema200',
    sector: 'sector',
    marketCapCategory: 'marketCapCategory',
    aboveSma20: 'aboveSma20',
    aboveSma50: 'aboveSma50',
    aboveSma100: 'aboveSma100',
    aboveSma200: 'aboveSma200',
    aboveEma20: 'aboveEma20',
    aboveEma50: 'aboveEma50',
    aboveEma100: 'aboveEma100',
    aboveEma200: 'aboveEma200',
    crossover2050: 'crossover2050',
    crossover50100: 'crossover50100',
    crossover50200: 'crossover50200',
    bullishMacdCross: 'bullishMacdCross',
    bearishMacdCross: 'bearishMacdCross',
    new52wHigh: 'new52wHigh',
    new52wLow: 'new52wLow',
  };

  for (const [key, value] of Object.entries(where)) {
    const col = fieldMap[key];
    if (!col) continue;

    if (typeof value === 'boolean') {
      params.push(value);
      conditions.push(`"${col}" = $${params.length}`);
      continue;
    }

    // String equality (sector / market_cap_category use { equals, mode })
    if (typeof value === 'object' && value !== null && 'equals' in value && typeof value.equals === 'string') {
      params.push(value.equals.toLowerCase());
      conditions.push(`LOWER("${col}") = $${params.length}`);
      continue;
    }

    // Numeric operators
    if (typeof value === 'object' && value !== null) {
      if (typeof value.gt === 'number') {
        params.push(value.gt);
        conditions.push(`"${col}" > $${params.length}`);
      }
      if (typeof value.gte === 'number') {
        params.push(value.gte);
        conditions.push(`"${col}" >= $${params.length}`);
      }
      if (typeof value.lt === 'number') {
        params.push(value.lt);
        conditions.push(`"${col}" < $${params.length}`);
      }
      if (typeof value.lte === 'number') {
        params.push(value.lte);
        conditions.push(`"${col}" <= $${params.length}`);
      }
      if (typeof value.equals === 'number') {
        params.push(value.equals);
        conditions.push(`"${col}" = $${params.length}`);
      }
    }
  }

  const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { sql, params };
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export interface ResultsEngineOptions {
  limit?: number;
  page?: number;
  sortBy?: keyof ScreenerResultRow;
  sortOrder?: 'asc' | 'desc';
}

export interface ResultsEngineResponse {
  results: ScreenerResultRow[];
  total: number;
  page: number;
  totalPages: number;
  sectorBreakdown: Record<string, number>;
  bullishCount: number;
  bearishCount: number;
}

export async function executeScreenerQuery(
  where: Record<string, any>,
  options: ResultsEngineOptions = {}
): Promise<ResultsEngineResponse> {
  const { limit = 50, page = 1, sortBy = 'relevanceScore', sortOrder = 'desc' } = options;

  try {
    const { sql: whereSql, params } = buildSqlWhere(where);

    const query = `
      SELECT
        symbol,
        "companyName" AS company_name,
        sector,
        "marketCapCategory" AS market_cap_category,
        "closePrice" AS close_price,
        "changePct" AS change_pct,
        "volumeRatio" AS volume_ratio,
        rsi14,
        sma20, sma50, sma100, sma200,
        ema20, ema50,
        macd, "macdSignal" AS macd_signal, "macdHistogram" AS macd_histogram,
        "aboveSma20" AS above_sma20, "aboveSma50" AS above_sma50, "aboveSma100" AS above_sma100, "aboveSma200" AS above_sma200,
        "bullishMacdCross" AS bullish_macd_cross, "bearishMacdCross" AS bearish_macd_cross,
        "new52wHigh" AS new52w_high, "new52wLow" AS new52w_low,
        "week52High" AS week52_high, "week52Low" AS week52_low,
        "distanceFrom52wHigh" AS distance_from52w_high,
        "volumeToday" AS volume_today, "avgVolume20" AS avg_volume20,
        crossover2050, crossover50100, crossover50200
      FROM stock_metrics
      ${whereSql}
      LIMIT 500
    `;

    const rawRows = await prisma.$queryRawUnsafe<RawRow[]>(query, ...params);
    logger.info(`[ResultsEngine] Raw query returned ${rawRows.length} rows`);

    const mapped = rawRows.map(mapRow);

    // Sort in memory by relevance score or requested field
    mapped.sort((a, b) => {
      const aVal = (a[sortBy] as number) ?? 0;
      const bVal = (b[sortBy] as number) ?? 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    const total = mapped.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginated = mapped.slice(offset, offset + limit);

    const sectorBreakdown: Record<string, number> = {};
    for (const row of mapped) {
      sectorBreakdown[row.sector] = (sectorBreakdown[row.sector] ?? 0) + 1;
    }

    const bullishCount = mapped.filter(r => r.trendLabel === 'bullish').length;
    const bearishCount = mapped.filter(r => r.trendLabel === 'bearish').length;

    return { results: paginated, total, page, totalPages, sectorBreakdown, bullishCount, bearishCount };
  } catch (err) {
    logger.error('[ResultsEngine] Query execution failed', { err });
    throw err;
  }
}
