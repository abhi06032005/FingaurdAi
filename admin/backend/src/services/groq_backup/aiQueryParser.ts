import Groq from 'groq-sdk';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterOperator = {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  between?: [number, number];
  equals?: number | string;
  contains?: string;
};

export interface ScreenerFilter {
  // Numeric range filters
  change_pct?: FilterOperator;
  volume_ratio?: FilterOperator;
  rsi14?: FilterOperator;
  sma20?: FilterOperator;
  sma50?: FilterOperator;
  sma100?: FilterOperator;
  sma200?: FilterOperator;
  ema20?: FilterOperator;
  ema50?: FilterOperator;
  ema100?: FilterOperator;
  ema200?: FilterOperator;

  // String equality filters
  sector?: string;
  market_cap_category?: string;

  // Boolean filters
  above_sma20?: boolean;
  above_sma50?: boolean;
  above_sma100?: boolean;
  above_sma200?: boolean;
  above_ema20?: boolean;
  above_ema50?: boolean;
  above_ema100?: boolean;
  above_ema200?: boolean;
  crossover_20_50?: boolean;
  crossover_50_100?: boolean;
  crossover_50_200?: boolean;
  bullish_macd_cross?: boolean;
  bearish_macd_cross?: boolean;
  new_52w_high?: boolean;
  new_52w_low?: boolean;
}

// ─── AI Client ────────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a stock screener query parser. Your ONLY job is to convert natural language stock screening queries into a strict JSON filter object.

ALLOWED FILTER FIELDS:
Numeric (support: gt, gte, lt, lte, between as [min,max]):
  change_pct, volume_ratio, rsi14,
  sma20, sma50, sma100, sma200,
  ema20, ema50, ema100, ema200

String (support: exact string value):
  sector — values: "IT" | "Banking" | "Pharma" | "FMCG" | "Automobile" | "Finance" | "Energy" | "Metals" | "Infrastructure" | "Telecom" | "Healthcare" | "Insurance" | "Utilities" | "Materials" | "Defence" | "Agriculture" | "Consumer" | "Conglomerate"
  market_cap_category — values: "largecap" | "midcap" | "smallcap" | "microcap"

Boolean (support: true | false):
  above_sma20, above_sma50, above_sma100, above_sma200
  above_ema20, above_ema50, above_ema100, above_ema200
  crossover_20_50, crossover_50_100, crossover_50_200
  bullish_macd_cross, bearish_macd_cross
  new_52w_high, new_52w_low

RULES:
1. Output ONLY valid JSON — no prose, no markdown, no code fences.
2. Only include fields that are explicitly implied by the query.
3. For "above X SMA" use above_smaX boolean = true (not a numeric comparison).
4. For "down more than 4%" use change_pct: { lte: -4 }
5. For "RSI below 40" use rsi14: { lt: 40 }
6. For "large cap" or "largecap" use market_cap_category: "largecap"
7. For "volume 2x average" use volume_ratio: { gte: 2 }
8. For "52-week high" use new_52w_high: true
9. For "MACD bullish crossover" use bullish_macd_cross: true
10. For "50 SMA crossed above 100 SMA" use crossover_50_100: true
11. If query is unclear or has no valid filters, return {}

EXAMPLES:
Query: "Stocks above 20 SMA and down more than 4% today"
Output: {"above_sma20":true,"change_pct":{"lte":-4}}

Query: "Large cap IT stocks with RSI below 40"
Output: {"market_cap_category":"largecap","sector":"IT","rsi14":{"lt":40}}

Query: "Stocks with volume 2x average and above 200 SMA"
Output: {"volume_ratio":{"gte":2},"above_sma200":true}

Query: "Breakout stocks with RSI above 60"
Output: {"rsi14":{"gt":60},"new_52w_high":true}

Query: "Stocks making new 52-week highs"
Output: {"new_52w_high":true}

Query: "MACD bullish crossover stocks"
Output: {"bullish_macd_cross":true}

Query: "Stocks where 50 SMA crossed above 100 SMA"
Output: {"crossover_50_100":true}`;

// ─── Parser ───────────────────────────────────────────────────────────────────

export async function parseScreenerQuery(userQuery: string): Promise<ScreenerFilter> {
  if (!userQuery || userQuery.trim().length === 0) return {};

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuery.trim() },
      ],
      temperature: 0,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '{}';
    logger.info(`[AIQueryParser] Query: "${userQuery}" → ${raw}`);

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return sanitizeFilter(parsed);
  } catch (err) {
    logger.error('[AIQueryParser] Failed to parse query', { err, userQuery });
    return {};
  }
}

// ─── Sanitize ─────────────────────────────────────────────────────────────────

const ALLOWED_NUMERIC_FIELDS = new Set([
  'change_pct', 'volume_ratio', 'rsi14',
  'sma20', 'sma50', 'sma100', 'sma200',
  'ema20', 'ema50', 'ema100', 'ema200',
]);

const ALLOWED_STRING_FIELDS = new Set(['sector', 'market_cap_category']);

const ALLOWED_BOOLEAN_FIELDS = new Set([
  'above_sma20', 'above_sma50', 'above_sma100', 'above_sma200',
  'above_ema20', 'above_ema50', 'above_ema100', 'above_ema200',
  'crossover_20_50', 'crossover_50_100', 'crossover_50_200',
  'bullish_macd_cross', 'bearish_macd_cross',
  'new_52w_high', 'new_52w_low',
]);

const ALLOWED_OPERATORS = new Set(['gt', 'gte', 'lt', 'lte', 'between', 'equals', 'contains']);

function sanitizeFilter(raw: Record<string, unknown>): ScreenerFilter {
  const result: ScreenerFilter = {};

  for (const [key, value] of Object.entries(raw)) {
    if (ALLOWED_BOOLEAN_FIELDS.has(key) && typeof value === 'boolean') {
      (result as any)[key] = value;
    } else if (ALLOWED_STRING_FIELDS.has(key) && typeof value === 'string') {
      (result as any)[key] = value.toLowerCase();
    } else if (ALLOWED_NUMERIC_FIELDS.has(key) && typeof value === 'object' && value !== null) {
      const op: Record<string, unknown> = {};
      for (const [opKey, opVal] of Object.entries(value as Record<string, unknown>)) {
        if (!ALLOWED_OPERATORS.has(opKey)) continue;
        if (opKey === 'between' && Array.isArray(opVal) && opVal.length === 2) {
          op[opKey] = [Number(opVal[0]), Number(opVal[1])];
        } else if (typeof opVal === 'number') {
          op[opKey] = opVal;
        }
      }
      if (Object.keys(op).length > 0) (result as any)[key] = op;
    }
  }

  return result;
}
