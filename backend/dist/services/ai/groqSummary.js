"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEducationalSummary = getEducationalSummary;
const pdfAnnualReport_1 = require("../pdfAnnualReport");
const AiReport_1 = __importDefault(require("../../models/AiReport"));
const logger_1 = require("../../utils/logger");
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
 * Generates an educational technical summary using Groq and caches it in MongoDB.
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
            logger_1.logger.warn(`MongoDB check failed in getEducationalSummary for ${symbol}, proceeding with Groq call directly:`, mongoError);
        }
        if (cachedReport) {
            logger_1.logger.info(`Groq summary cache hit for ${symbol} on ${dateOnly.toISOString().split('T')[0]}`);
            return {
                summary: cachedReport.summary,
                generatedAt: cachedReport.generatedAt
            };
        }
        logger_1.logger.info(`Groq summary cache miss for ${symbol} on ${dateOnly.toISOString().split('T')[0]}. Requesting from Groq...`);
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
        const response = await pdfAnnualReport_1.groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 400
        });
        const summaryText = response.choices[0]?.message?.content?.trim();
        if (!summaryText) {
            throw new Error('Empty response from Groq');
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
                modelUsed: 'llama-3.3-70b-versatile'
            });
        }
        catch (mongoError) {
            logger_1.logger.warn(`Failed to write AI report to MongoDB for ${symbol}, proceeding anyway:`, mongoError);
        }
        logger_1.logger.info(`Successfully generated Groq summary for ${symbol}`);
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
