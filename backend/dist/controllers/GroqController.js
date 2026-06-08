"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResearchReport = generateResearchReport;
const groq_1 = require("../services/groq");
/**
 * Generates an AI-powered professional stock research report using Yahoo Finance data.
 */
async function generateResearchReport(marketData) {
    const prompt = `
Analyze the following Indian stock like a professional equity research analyst.
All monetary values should be interpreted in their respective currencies (usually INR for Indian stocks).

=== YAHOO FINANCE MARKET DATA ===
${JSON.stringify(marketData, null, 2)}

Generate a detailed, publication-grade equity research report with the following structured sections:

1. Executive Summary (4-5 sentences: company, current market position, valuation, key signal)

2. Business Overview
   - Describe what the company does based on its sector, industry, and any profile data available.

3. Financial & Growth Analysis
   - Analyze revenue, profits, and margins if available in the financials.
   - Comment on the recent growth trends based on the data provided.

4. Profitability & Returns
   - Comment on return on equity (ROE), return on assets (ROA), and margins.

5. Balance Sheet & Cash Flow
   - Evaluate debt levels, cash positions, and operating cash flows based on the provided data.

6. Valuation Analysis
   - Comment on PE, Forward PE, PB, PS, PEG, EV/EBITDA, and Dividend Yield.
   - Are these multiples attractive?

7. Long-Term Investment Thesis (3-4 sentences: the bull/bear case in plain language)

RULES:
- Support every claim with a number from the data if available.
- Do not invent data not present in the input.
- If certain metrics are missing from the input data, skip them or note that they are unavailable.
- Write in the tone of a Bloomberg Intelligence report: precise, number-dense, opinionated.
`;
    const completion = await groq_1.groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.3,
        messages: [
            {
                role: 'system',
                content: `
You are a senior equity research analyst at an Indian institutional brokerage.
You specialize in Indian companies across infrastructure, industrials, IT, and BFSI.
Write in the tone of a Bloomberg Intelligence report: precise, number-dense, opinionated.
        `.trim(),
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
    });
    return completion.choices[0]?.message?.content || 'Failed to generate report';
}
exports.default = generateResearchReport;
