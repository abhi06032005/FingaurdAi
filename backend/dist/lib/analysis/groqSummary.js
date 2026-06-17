"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGroqSummary = generateGroqSummary;
const pdfAnnualReport_1 = require("../../services/pdfAnnualReport");
const logger_1 = require("../../utils/logger");
async function generateGroqSummary(input) {
    try {
        // Determine neutral labels
        const rsiLabel = input.rsi > 70 ? 'Elevated' : (input.rsi < 30 ? 'Compressed' : 'Neutral');
        const macdTrend = Math.abs(input.macdHistogram) > Math.abs(input.prevMacdHistogram) ? 'expanding' : 'contracting';
        const adxStrength = input.adx > 25 ? 'strong' : (input.adx > 15 ? 'moderate' : 'weak');
        let hurstLabel = 'random walk';
        if (input.hurstExponent > 0.55)
            hurstLabel = 'trending';
        else if (input.hurstExponent < 0.45)
            hurstLabel = 'mean-reverting';
        const efficiencyLabel = input.efficiencyRatio > 0.4 ? 'trending' : 'choppy';
        const systemPrompt = "You are a neutral financial educator. You never give buy or sell recommendations. Explain what technical indicators collectively reveal about a stock's recent price behaviour in plain language. Be factual, concise, and educational.";
        const userPrompt = `Stock: ${input.ticker}
RSI(14): ${input.rsi.toFixed(2)} — ${rsiLabel}
MACD Histogram: ${input.macdHistogram.toFixed(4)} (${macdTrend})
Price %B (Bollinger): ${input.pricePercentB.toFixed(4)}
ADX: ${input.adx.toFixed(2)} — trend strength ${adxStrength}
Hurst Exponent: ${input.hurstExponent.toFixed(4)} — ${hurstLabel}
Efficiency Ratio: ${input.efficiencyRatio.toFixed(4)} — ${efficiencyLabel}
Realized Volatility (annualized): ${input.realizedVolatility.toFixed(2)}%
Price Percentile Rank (150d): ${input.percentileRank.toFixed(1)}
Current Drawdown from Peak: ${input.currentDrawdown.toFixed(2)}%
Sharpe Ratio (150d): ${input.sharpeRatio.toFixed(2)}
Composite Confluence Score: ${input.compositeConfluence.toFixed(4)}

Upgraded Context:
Current Market Structure (Regime): ${input.marketStructure}
Largest Contributor to Confluence: ${input.largestContributor}
Relative Strength vs NIFTY (5d / 20d Returns): ${input.relativeStrength5d.toFixed(1)}% / ${input.relativeStrength20d.toFixed(1)}%
Model Confidence Score: ${input.confidenceScore}/100

In 3–4 sentences, describe what these indicators collectively reveal about this stock's recent price behaviour, explaining the current market structure, the largest contributor to confluence, the relative strength vs NIFTY, and the confidence score interpretation. Do not recommend any action. Do not forecast any price targets or use bullish/bearish language. End with one sentence about what a retail investor should understand about interpreting these signals together.`;
        logger_1.logger.info(`Sending technical summary prompt to Groq for ${input.ticker}`);
        const response = await pdfAnnualReport_1.groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 250
        });
        let summaryText = response.choices[0]?.message?.content?.trim() || '';
        // Safety checks: double-check that forbidden words are not present in AI output
        const forbiddenWords = ['buy', 'sell', 'bullish', 'bearish', 'overbought', 'oversold', 'recommend', 'target price', 'upside', 'downside'];
        for (const word of forbiddenWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(summaryText)) {
                logger_1.logger.warn(`Detected forbidden word "${word}" in Groq response. Sanitizing...`);
                summaryText = summaryText.replace(regex, (match) => {
                    const m = match.toLowerCase();
                    if (m === 'bullish')
                        return 'aligned';
                    if (m === 'bearish')
                        return 'contracting';
                    if (m === 'overbought')
                        return 'elevated';
                    if (m === 'oversold')
                        return 'compressed';
                    return '[neutralized]';
                });
            }
        }
        return summaryText;
    }
    catch (error) {
        logger_1.logger.error(`Failed to generate Groq summary for ${input.ticker}:`, error);
        return 'Analysis completed. Indicator trends remain neutral. A retail investor should understand that technical indicators are educational snapshots of price behavior and do not predict future performance.';
    }
}
