"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEducationalSummary = getEducationalSummary;
const generative_ai_1 = require("@google/generative-ai");
const AiReport_1 = __importDefault(require("../../models/AiReport"));
const logger_1 = require("../../utils/logger");
const geminiRateLimiter_1 = require("../../utils/geminiRateLimiter");
function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    return new generative_ai_1.GoogleGenerativeAI(apiKey);
}
const SYSTEM_PROMPT = `You are an educational assistant on an Indian stock market analysis platform.
Your sole purpose is to explain technical indicators to learners.

ABSOLUTE RULES — NEVER BREAK THESE:
1. Never use the words: buy, sell, purchase, invest, accumulate, exit, enter, long, short, target price, stop loss, or any equivalent phrasing.
2. Never predict future price movements or returns.
3. Never recommend any action related to the stock.
4. This platform is for education only — treat every response accordingly.

Structure your response in exactly these four sections with these headings:
**Trend Analysis** — explain what the moving averages and ADX reveal
**Momentum Analysis** — explain what RSI, MACD, and Stochastic RSI indicate
**Volatility Analysis** — explain what Bollinger Bands and ATR reveal
**Volume Analysis** — explain what OBV slope suggests

Keep the total response under 250 words. Use plain English. Explain any technical terms used. End with exactly this sentence:
"This analysis is purely educational and does not constitute financial advice."`;
/**
 * Generates an educational technical summary using Gemini and caches it in MongoDB.
 */
async function getEducationalSummary({ symbol, candleDate, currentPrice, indicators }) {
    const dateOnly = new Date(candleDate.toISOString().split('T')[0]);
    try {
        // 1. Check MongoDB cache first (wrapped in try-catch to allow bypass if MongoDB is down)
        let cachedReport = null;
        try {
            cachedReport = await AiReport_1.default.findOne({ symbol, candleDate: dateOnly });
        }
        catch (mongoError) {
            logger_1.logger.warn(`MongoDB check failed in getEducationalSummary for ${symbol}, proceeding with Gemini call directly:`, mongoError);
        }
        if (cachedReport) {
            logger_1.logger.info(`Gemini summary cache hit for ${symbol} on ${dateOnly.toISOString().split('T')[0]}`);
            return {
                summary: cachedReport.summary,
                generatedAt: cachedReport.generatedAt
            };
        }
        logger_1.logger.info(`Gemini summary cache miss for ${symbol} on ${dateOnly.toISOString().split('T')[0]}. Requesting from Gemini...`);
        const rsi = indicators.momentum.rsi?.value ?? 'N/A';
        const macdVal = indicators.momentum.macd?.macd ?? 'N/A';
        const macdSignal = indicators.momentum.macd?.signal ?? 'N/A';
        const macdHist = indicators.momentum.macd?.histogram ?? 'N/A';
        const stochK = indicators.momentum.stochasticRsi?.k ?? 'N/A';
        const stochD = indicators.momentum.stochasticRsi?.d ?? 'N/A';
        const sma20 = indicators.trend.sma20 ?? 'N/A';
        const sma50 = indicators.trend.sma50 ?? 'N/A';
        const sma200 = indicators.trend.sma200 ?? 'N/A';
        const ema20 = indicators.trend.ema20 ?? 'N/A';
        const ema50 = indicators.trend.ema50 ?? 'N/A';
        const ema200 = indicators.trend.ema200 ?? 'N/A';
        const bbUpper = indicators.volatility.bollingerBands?.upper ?? 'N/A';
        const bbMiddle = indicators.volatility.bollingerBands?.middle ?? 'N/A';
        const bbLower = indicators.volatility.bollingerBands?.lower ?? 'N/A';
        const percentB = indicators.volatility.bollingerBands?.percentB ?? 'N/A';
        const atr = indicators.volatility.atr ?? 'N/A';
        const adx = indicators.trend.adx?.adx ?? 'N/A';
        const plusDI = indicators.trend.adx?.plusDI ?? 'N/A';
        const minusDI = indicators.trend.adx?.minusDI ?? 'N/A';
        const obvSlope = indicators.volume.obv?.slope ?? 'N/A';
        const userPrompt = `Here are the current technical indicator values for ${symbol}:

RSI (14): ${rsi}
MACD: ${macdVal}, Signal: ${macdSignal}, Histogram: ${macdHist}
Stochastic RSI K: ${stochK}, D: ${stochD}
SMA 20: ${sma20}, SMA 50: ${sma50}, SMA 200: ${sma200}
EMA 20: ${ema20}, EMA 50: ${ema50}, EMA 200: ${ema200}
Bollinger Bands: Upper ${bbUpper}, Middle ${bbMiddle}, Lower ${bbLower}, %B: ${percentB}
ATR (14): ${atr}
ADX (14): ${adx}, +DI: ${plusDI}, -DI: ${minusDI}
OBV Slope: ${obvSlope}
Current Price: ${currentPrice}

Please provide an educational technical summary.`;
        const genAI = getGemini();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_PROMPT,
        });
        // Route through the global rate-limiter queue
        const response = await (0, geminiRateLimiter_1.geminiQueue)(() => model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 400,
            }
        }));
        const summaryText = response.response.text()?.trim();
        if (!summaryText) {
            throw new Error('Empty response from Gemini');
        }
        const generatedAt = new Date();
        // 2. Try to cache in MongoDB (wrapped in try-catch so we don't crash if MongoDB is down)
        try {
            await AiReport_1.default.create({
                symbol,
                candleDate: dateOnly,
                summary: summaryText,
                indicators: {
                    rsi,
                    macd: { macd: macdVal, signal: macdSignal, histogram: macdHist },
                    stochasticRsi: { k: stochK, d: stochD },
                    sma20, sma50, sma200,
                    ema20, ema50, ema200,
                    bollingerBands: { upper: bbUpper, middle: bbMiddle, lower: bbLower, percentB },
                    atr,
                    adx: { adx, plusDI, minusDI },
                    obvSlope
                },
                generatedAt,
                modelUsed: 'gemini-2.0-flash'
            });
        }
        catch (mongoError) {
            logger_1.logger.warn(`Failed to write AI report to MongoDB for ${symbol}, proceeding anyway:`, mongoError);
        }
        logger_1.logger.info(`Successfully generated Gemini summary for ${symbol}`);
        return {
            summary: summaryText,
            generatedAt
        };
    }
    catch (error) {
        logger_1.logger.error(`Error in getEducationalSummary for ${symbol}:`, error);
        return null;
    }
}
