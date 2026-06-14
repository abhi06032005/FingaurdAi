import { z } from 'zod';

// List of allowed NIFTY 50 symbols
export const NIFTY_50_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS',
  'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
  'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'BAJFINANCE.NS',
  'HCLTECH.NS', 'SUNPHARMA.NS', 'TITAN.NS', 'WIPRO.NS', 'ULTRACEMCO.NS',
  'ONGC.NS', 'POWERGRID.NS', 'NTPC.NS', 'TECHM.NS', 'M&M.NS',
  'JSWSTEEL.NS', 'TATASTEEL.NS', 'INDUSINDBK.NS', 'BAJAJFINSV.NS', 'COALINDIA.NS',
  'NESTLEIND.NS', 'BPCL.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'DRREDDY.NS',
  'GRASIM.NS', 'CIPLA.NS', 'HINDALCO.NS', 'DIVISLAB.NS', 'EICHERMOT.NS',
  'BRITANNIA.NS', 'APOLLOHOSP.NS', 'BAJAJ-AUTO.NS', 'TATACONSUM.NS', 'HEROMOTOCO.NS',
  'SBILIFE.NS', 'HDFCLIFE.NS', 'LTIM.NS', 'UPL.NS', 'BEL.NS'
] as const;

export const SymbolParamSchema = z.object({
  symbol: z.string().refine((val: string) => (NIFTY_50_SYMBOLS as readonly string[]).includes(val), {
    message: 'Invalid stock symbol. Must be a valid NIFTY 50 symbol.',
  }),
});

export const CandleSchema = z.object({
  symbol: z.string(),
  date: z.date().or(z.string()),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().or(z.bigint()),
  dataQuality: z.number(),
  createdAt: z.date().or(z.string()).optional(),
});

export const SignalSchema = z.object({
  indicator: z.string(),
  value: z.string(),
  signal: z.string(),
  direction: z.enum(['bullish', 'bearish', 'neutral']),
  strength: z.enum(['weak', 'moderate', 'strong']),
});

export const DivergenceSchema = z.object({
  type: z.enum(['bullish_rsi', 'bearish_rsi', 'bullish_macd', 'bearish_macd']),
  strength: z.enum(['weak', 'moderate', 'strong']),
  description: z.string(),
});

export const ScoreHistoryItemSchema = z.object({
  date: z.string(),
  score: z.number(),
  rating: z.string(),
});

export const TechnicalAnalysisResponseSchema = z.object({
  symbol: z.string(),
  companyName: z.string(),
  currentPrice: z.number(),
  priceChange: z.number(),
  priceChangePct: z.number(),

  technicalScore: z.number(),
  technicalRating: z.string(),
  confluenceScore: z.number(),
  scoreBreakdown: z.record(z.string(), z.number()),

  indicators: z.object({
    rsi: z.number().nullable(),
    macd: z.object({
      macd: z.number(),
      signal: z.number(),
      histogram: z.number(),
    }).nullable(),
    stochasticRsi: z.object({
      k: z.number(),
      d: z.number(),
    }).nullable(),
    sma20: z.number().nullable(),
    sma50: z.number().nullable(),
    sma200: z.number().nullable(),
    ema20: z.number().nullable(),
    ema50: z.number().nullable(),
    ema200: z.number().nullable(),
    bollingerBands: z.object({
      upper: z.number(),
      middle: z.number(),
      lower: z.number(),
      bandwidth: z.number(),
      percentB: z.number(),
    }).nullable(),
    atr: z.number().nullable(),
    adx: z.object({
      adx: z.number(),
      plusDI: z.number(),
      minusDI: z.number(),
    }).nullable(),
    obv: z.object({
      obv: z.number(),
      slope: z.enum(['rising', 'falling', 'flat']),
    }).nullable(),
  }),

  signals: z.array(SignalSchema),
  divergences: z.array(DivergenceSchema),
  scoreHistory: z.array(ScoreHistoryItemSchema),

  aiSummary: z.string().nullable(),
  aiGeneratedAt: z.string().nullable(),

  dataQuality: z.number(),
  candlesUsed: z.number(),
  generatedAt: z.string(),
  isCached: z.boolean(),
});

export type CandleType = z.infer<typeof CandleSchema>;
export type SignalType = z.infer<typeof SignalSchema>;
export type DivergenceType = z.infer<typeof DivergenceSchema>;
export type ScoreHistoryItemType = z.infer<typeof ScoreHistoryItemSchema>;
export type TechnicalAnalysisResponseType = z.infer<typeof TechnicalAnalysisResponseSchema>;
