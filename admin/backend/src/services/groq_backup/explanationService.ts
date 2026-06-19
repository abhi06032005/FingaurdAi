import Groq from 'groq-sdk';
import { logger } from '../../utils/logger';
import { ScreenerFilter } from './aiQueryParser';
import { ResultsEngineResponse } from './resultsEngine';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generates a concise, human-readable explanation of screener results.
 * Called AFTER results are fetched — AI never sees individual stock data.
 */
export async function generateScreenerExplanation(
  originalQuery: string,
  filter: ScreenerFilter,
  response: ResultsEngineResponse,
): Promise<string> {
  if (response.total === 0) {
    return `No stocks matched your criteria for "${originalQuery}". Try relaxing your filters or using a broader query.`;
  }

  // Build sector summary string
  const topSectors = Object.entries(response.sectorBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, count]) => `${sector} (${count})`)
    .join(', ');

  const filterSummary = JSON.stringify(filter, null, 2);

  const prompt = `A stock screener returned the following results:
- Original user query: "${originalQuery}"
- Applied filters: ${filterSummary}
- Total matches: ${response.total}
- Bullish stocks: ${response.bullishCount}
- Bearish stocks: ${response.bearishCount}
- Top sectors: ${topSectors || 'Mixed'}

Write a 2-3 sentence plain English explanation of what these results mean for a retail investor. 
Be specific about what the filters mean technically. Do not recommend buying or selling. 
Do not mention specific stock names. Keep it under 80 words.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a financial markets analyst who explains stock screening results in plain English. Be concise, factual, and educational. Never give buy/sell recommendations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    const explanation = completion.choices[0]?.message?.content?.trim() ?? '';
    logger.info(`[ExplanationService] Generated explanation for query: "${originalQuery}"`);
    return explanation;
  } catch (err) {
    logger.error('[ExplanationService] Failed to generate explanation', { err });
    return `${response.total} stocks matched your criteria. ${response.bullishCount} show bullish signals and ${response.bearishCount} show bearish signals. Top sectors: ${topSectors || 'Mixed'}.`;
  }
}
