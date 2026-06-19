"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGroqSummary = generateGroqSummary;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = require("../../utils/logger");
const geminiRateLimiter_1 = require("../../utils/geminiRateLimiter");
function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    return new generative_ai_1.GoogleGenerativeAI(apiKey);
}
const SYSTEM_PROMPT = `You are a neutral financial educator on an Indian stock market analytics platform for retail learners.

ABSOLUTE RULES — NEVER BREAK THESE:
1. Never use the words: buy, sell, purchase, invest, accumulate, exit, enter, long, short, target price, stop loss, upside, downside, or any equivalent phrasing.
2. Never predict future price movements, returns, or market direction.
3. Never recommend any action related to the stock.
4. This platform is for education and market context only — treat every response accordingly.
5. End EVERY response with exactly this sentence: "These measurements describe recent market behaviour and should be interpreted as analytical context rather than a forecast."

Structure your response in plain English covering these five areas (no headings — write it as flowing paragraphs):
1. What price is doing right now (based on trend, percentile, drawdown)
2. What volume is doing (based on OBV slope, volume ratio, VWAP position)
3. What changed recently (the biggest shifts in the past day)
4. What market structure shows (regime, Hurst, efficiency ratio)
5. Which metrics matter most in today's context

Keep the total response under 150 words. Use zero jargon without explaining it immediately. Write for someone who has never invested before.`;
async function generateGroqSummary(input) {
    try {
        const rsiLabel = input.rsi > 70 ? 'elevated above 70 (stretched upward)' : (input.rsi < 30 ? 'compressed below 30 (stretched downward)' : `neutral at ${input.rsi.toFixed(0)}`);
        const macdTrend = Math.abs(input.macdHistogram) > Math.abs(input.prevMacdHistogram) ? 'gaining strength' : 'losing strength';
        const adxStrength = input.adx > 25 ? 'strong directional movement' : (input.adx > 15 ? 'developing movement' : 'no clear directional movement');
        const hurstContext = input.hurstExponent > 0.55 ? 'trending pattern' : (input.hurstExponent < 0.45 ? 'mean-reverting pattern' : 'random walk behaviour');
        const drawdownCtx = input.currentDrawdown < 3 ? 'near recent peak' : (input.currentDrawdown > 12 ? 'in a notable pullback' : `${input.currentDrawdown.toFixed(1)}% below recent peak`);
        const volCtx = input.volumeRatio ? (input.volumeRatio > 1.3 ? 'above-average volume' : (input.volumeRatio < 0.7 ? 'below-average volume' : 'average volume')) : 'normal volume';
        const vwapCtx = input.vwapDistancePct ? (input.vwapDistancePct > 1 ? 'above the volume-weighted average price' : (input.vwapDistancePct < -1 ? 'below the volume-weighted average price' : 'near the volume-weighted average price')) : '';
        const recentShift = (input.dRsi && Math.abs(input.dRsi) > 2) ? `RSI shifted ${input.dRsi > 0 ? 'up' : 'down'} by ${Math.abs(input.dRsi).toFixed(1)} points since yesterday` : '';
        const volShift = (input.dVol && Math.abs(input.dVol) > 2) ? `volatility ${input.dVol > 0 ? 'increased' : 'decreased'} by ${Math.abs(input.dVol).toFixed(1)}%` : '';
        const userPrompt = `Stock: ${input.ticker}
Percentile rank in 300-day range: ${input.percentileRank.toFixed(0)}/100
Current drawdown from recent peak: ${drawdownCtx}
RSI momentum reading: ${rsiLabel}
MACD momentum direction: ${macdTrend}
ADX trend strength: ${adxStrength}
Volume activity: ${volCtx}${vwapCtx ? `, ${vwapCtx}` : ''}
OBV slope: ${input.obvSlope || 'neutral'}
${recentShift ? `Recent change: ${recentShift}` : ''}${volShift ? `, ${volShift}` : ''}
Market structure regime: ${input.marketStructure}
Price memory pattern: ${hurstContext}
Efficiency ratio: ${input.efficiencyRatio.toFixed(2)} (${input.efficiencyRatio > 0.4 ? 'trending efficiently' : 'choppy movement'})
Realized volatility: ${input.realizedVolatility.toFixed(1)}% annualized
Relative strength vs peers — 5d: ${input.relativeStrength5d.toFixed(1)}%, 20d: ${input.relativeStrength20d.toFixed(1)}%
Confidence score: ${input.confidenceScore}/100
Most significant contributor: ${input.largestContributor}

Write a 130–150 word plain-language market context summary following the system instructions exactly.`;
        logger_1.logger.info(`Sending narrative summary prompt to Gemini for ${input.ticker}`);
        const response = await (0, geminiRateLimiter_1.geminiQueue)((genAI) => {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                systemInstruction: SYSTEM_PROMPT,
            });
            return model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.25,
                    maxOutputTokens: 300,
                }
            });
        });
        let summaryText = response.response.text()?.trim() || '';
        // Safety sanitization: replace any forbidden words
        const replacements = {
            bullish: 'aligned upward',
            bearish: 'tilted downward',
            overbought: 'stretched high',
            oversold: 'stretched low',
            buy: '[action term removed]',
            sell: '[action term removed]',
            recommend: 'note',
            'target price': 'price level',
            upside: 'upward range',
            downside: 'downward range',
        };
        for (const [word, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(summaryText)) {
                logger_1.logger.warn(`Detected forbidden term "${word}" in Groq response. Replacing...`);
                summaryText = summaryText.replace(regex, replacement);
            }
        }
        // Ensure disclaimer is always present
        const disclaimer = 'These measurements describe recent market behaviour and should be interpreted as analytical context rather than a forecast.';
        if (!summaryText.includes('analytical context rather than a forecast')) {
            summaryText = summaryText.trimEnd() + '\n\n' + disclaimer;
        }
        return summaryText;
    }
    catch (error) {
        logger_1.logger.error(`Failed to generate Groq narrative summary for ${input.ticker}:`, error);
        return `Analysis completed for ${input.ticker}. The current market structure indicates ${input.marketStructure.toLowerCase()} conditions, with a confidence score of ${input.confidenceScore}/100 across the analytical models. Price sits at the ${input.percentileRank.toFixed(0)}th percentile of its recent range, with realized volatility at ${input.realizedVolatility.toFixed(1)}% annualized. These measurements describe recent market behaviour and should be interpreted as analytical context rather than a forecast.`;
    }
}
