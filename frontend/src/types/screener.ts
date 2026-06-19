// ─── Filter Types ─────────────────────────────────────────────────────────────

export type FilterOperator = {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  between?: [number, number];
  equals?: number | string;
};

export interface ScreenerFilter {
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

  sector?: string;
  market_cap_category?: string;

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

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface StockMetricResult {
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

  relevanceScore: number;
  trendLabel: 'bullish' | 'bearish' | 'neutral';
  tags: string[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ScreenerResponse {
  success: boolean;
  query?: string;
  filter: ScreenerFilter;
  filterDescription: string;
  explanation?: string;
  results: StockMetricResult[];
  total: number;
  page: number;
  totalPages: number;
  sectorBreakdown: Record<string, number>;
  bullishCount: number;
  bearishCount: number;
  durationMs?: number;
  error?: string;
}

// ─── Suggestion Type ──────────────────────────────────────────────────────────

export interface ScreenerSuggestion {
  id: string;
  label: string;
  query: string;
}

// ─── Sort Config ──────────────────────────────────────────────────────────────

export type SortableField =
  | 'relevanceScore'
  | 'changePct'
  | 'volumeRatio'
  | 'rsi14'
  | 'closePrice'
  | 'distanceFrom52wHigh';

export interface SortConfig {
  field: SortableField;
  order: 'asc' | 'desc';
}
