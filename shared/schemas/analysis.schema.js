"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalAnalysisResponseSchema = exports.ScoreHistoryItemSchema = exports.DivergenceSchema = exports.SignalSchema = exports.CandleSchema = exports.SymbolParamSchema = exports.NIFTY_50_SYMBOLS = void 0;
const zod_1 = require("zod");
// List of allowed NIFTY 50 symbols
exports.NIFTY_50_SYMBOLS = [
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
];
exports.SymbolParamSchema = zod_1.z.object({
    symbol: zod_1.z.string().refine((val) => exports.NIFTY_50_SYMBOLS.includes(val), {
        message: 'Invalid stock symbol. Must be a valid NIFTY 50 symbol.',
    }),
});
exports.CandleSchema = zod_1.z.object({
    symbol: zod_1.z.string(),
    date: zod_1.z.date().or(zod_1.z.string()),
    open: zod_1.z.number(),
    high: zod_1.z.number(),
    low: zod_1.z.number(),
    close: zod_1.z.number(),
    volume: zod_1.z.number().or(zod_1.z.bigint()),
    dataQuality: zod_1.z.number(),
    createdAt: zod_1.z.date().or(zod_1.z.string()).optional(),
});
exports.SignalSchema = zod_1.z.object({
    indicator: zod_1.z.string(),
    value: zod_1.z.string(),
    signal: zod_1.z.string(),
    direction: zod_1.z.enum(['bullish', 'bearish', 'neutral']),
    strength: zod_1.z.enum(['weak', 'moderate', 'strong']),
});
exports.DivergenceSchema = zod_1.z.object({
    type: zod_1.z.enum(['bullish_rsi', 'bearish_rsi', 'bullish_macd', 'bearish_macd']),
    strength: zod_1.z.enum(['weak', 'moderate', 'strong']),
    description: zod_1.z.string(),
});
exports.ScoreHistoryItemSchema = zod_1.z.object({
    date: zod_1.z.string(),
    score: zod_1.z.number(),
    rating: zod_1.z.string(),
});
exports.TechnicalAnalysisResponseSchema = zod_1.z.object({
    symbol: zod_1.z.string(),
    companyName: zod_1.z.string(),
    currentPrice: zod_1.z.number(),
    priceChange: zod_1.z.number(),
    priceChangePct: zod_1.z.number(),
    technicalScore: zod_1.z.number(),
    technicalRating: zod_1.z.string(),
    confluenceScore: zod_1.z.number(),
    scoreBreakdown: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    indicators: zod_1.z.object({
        rsi: zod_1.z.number().nullable(),
        macd: zod_1.z.object({
            macd: zod_1.z.number(),
            signal: zod_1.z.number(),
            histogram: zod_1.z.number(),
        }).nullable(),
        stochasticRsi: zod_1.z.object({
            k: zod_1.z.number(),
            d: zod_1.z.number(),
        }).nullable(),
        sma20: zod_1.z.number().nullable(),
        sma50: zod_1.z.number().nullable(),
        sma200: zod_1.z.number().nullable(),
        ema20: zod_1.z.number().nullable(),
        ema50: zod_1.z.number().nullable(),
        ema200: zod_1.z.number().nullable(),
        bollingerBands: zod_1.z.object({
            upper: zod_1.z.number(),
            middle: zod_1.z.number(),
            lower: zod_1.z.number(),
            bandwidth: zod_1.z.number(),
            percentB: zod_1.z.number(),
        }).nullable(),
        atr: zod_1.z.number().nullable(),
        adx: zod_1.z.object({
            adx: zod_1.z.number(),
            plusDI: zod_1.z.number(),
            minusDI: zod_1.z.number(),
        }).nullable(),
        obv: zod_1.z.object({
            obv: zod_1.z.number(),
            slope: zod_1.z.enum(['rising', 'falling', 'flat']),
        }).nullable(),
    }),
    signals: zod_1.z.array(exports.SignalSchema),
    divergences: zod_1.z.array(exports.DivergenceSchema),
    scoreHistory: zod_1.z.array(exports.ScoreHistoryItemSchema),
    aiSummary: zod_1.z.string().nullable(),
    aiGeneratedAt: zod_1.z.string().nullable(),
    dataQuality: zod_1.z.number(),
    candlesUsed: zod_1.z.number(),
    generatedAt: zod_1.z.string(),
    isCached: zod_1.z.boolean(),
});
