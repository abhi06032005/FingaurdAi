import express, { Request, Response } from 'express';
import { generateAndStoreAIReport } from '../services/aiReportService';
import { CompanyAIReport } from '../models/CompanyAIReport';
import Stock from '../models/Stock';
import { authenticate } from '../middlewares/authMiddleware';
import { groq } from '../services/pdfAnnualReport';

const router = express.Router();

/**
 * POST /api/ai-reports/generate
 * Body: { ticker: "RELIANCE", force?: true }
 *
 * Triggers AI report generation for a company using:
 * - MongoDB stocks collection (screener data: P&L, balance sheet, ratios, quarters)
 * - MongoDB annual_reports collection (PDF-extracted structured insights)
 *
 * Stores the result in company_ai_reports collection.
 * Responds immediately with 202 and runs generation in background.
 */
router.post('/generate', authenticate, async (req: Request, res: Response): Promise<any> => {
    const { ticker, force } = req.body;

    if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid "ticker" in request body. Example: { "ticker": "RELIANCE" }',
        });
    }

    const symbol = ticker.toUpperCase().trim();
    const forceRegenerate = !!force;

    console.log(`[AIReport Route] POST /generate — ticker: ${symbol}, force: ${forceRegenerate}`);

    // Respond immediately to avoid HTTP timeouts (generation can take 30-60s)
    res.status(202).json({
        success: true,
        message: `AI report generation started for ${symbol}. Check GET /api/ai-reports/${symbol} once complete.`,
        ticker: symbol,
    });

    // Run in background
    (async () => {
        try {
            const result = await generateAndStoreAIReport(symbol, forceRegenerate);
            if (result.success) {
                console.log(`[AIReport Route] ✓ Report generated for ${symbol} (ID: ${result.reportId})`);
            } else {
                console.error(`[AIReport Route] ✗ Report generation failed for ${symbol}: ${result.error}`);
            }
        } catch (err: any) {
            console.error(`[AIReport Route] ✗ Unhandled error for ${symbol}:`, err.message);
        }
    })();
});

/**
 * GET /api/ai-reports/:ticker
 *
 * Fetch the precomputed AI report for a company.
 * Returns the full report document from company_ai_reports, along with the raw stock data.
 */
router.get('/:ticker', async (req: Request, res: Response): Promise<any> => {
    const symbol = (req.params.ticker as string).toUpperCase().trim();

    try {
        const [report, stock] = await Promise.all([
            CompanyAIReport.findOne({ ticker: symbol }).lean(),
            Stock.findOne({ ticker: symbol }).lean()
        ]);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: `No AI report found for ${symbol}. Trigger generation via POST /api/ai-reports/generate`,
                ticker: symbol,
                stockData: stock || null,
            });
        }

        return res.status(200).json({
            success: true,
            ticker: symbol,
            report,
            stockData: stock || null,
        });
    } catch (err: any) {
        console.error(`[AIReport Route] GET /${symbol} error:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/ai-reports
 *
 * List all available AI reports (summary view, no raw_groq_response).
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
    try {
        const reports = await CompanyAIReport.find(
            {},
            {
                ticker: 1,
                company_name: 1,
                generated_at: 1,
                data_sources: 1,
                'executive_summary.one_liner': 1,
                'business_quality_score.overall_score': 1,
                'industry_context.sector': 1,
                generation_error: 1,
            }
        )
            .sort({ generated_at: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (err: any) {
        console.error('[AIReport Route] GET / error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/ai-reports/:ticker
 *
 * Delete the cached AI report for a company (to force fresh regeneration).
 */
router.delete('/:ticker', authenticate, async (req: Request, res: Response): Promise<any> => {
    const symbol = (req.params.ticker as string).toUpperCase().trim();

    try {
        const result = await CompanyAIReport.deleteOne({ ticker: symbol });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: `No report found for ${symbol}`,
            });
        }

        return res.status(200).json({
            success: true,
            message: `AI report for ${symbol} deleted. Regenerate via POST /api/ai-reports/generate`,
        });
    } catch (err: any) {
        console.error(`[AIReport Route] DELETE /${symbol} error:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/ai-reports/chat
 *
 * Empathy-first chat session for Indian retail traders using Llama-3.3-70b-versatile.
 */
router.post('/chat', async (req: Request, res: Response): Promise<any> => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'messages array required'
            });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 300,
            temperature: 0.85,
            messages: [
                {
                    role: "system",
                    content: `You are TradeSpace Guide — an empathetic
                    companion for Indian retail traders who are
                    processing losses and trading stress. Your
                    personality: warm, calm, honest, like a senior
                    trader friend who has seen losses himself and
                    genuinely cares.

                    Rules:
                    1. Always respond in the same language mix the
                       user used. If they write Hinglish, reply
                       Hinglish. If Hindi, reply Hindi. If English,
                       reply English.
                    2. Never use corporate language or generic
                       motivational quotes. No robotic phrases like
                       "I understand your feelings."
                    3. First message in a conversation: acknowledge
                       their emotion genuinely in 1-2 lines before
                       anything else.
                    4. Ask one specific follow-up question about
                       their trade or situation — show you are
                       actually listening.
                    5. Keep responses under 100 words. Short and
                       warm beats long and clinical.
                    6. If user mentions large losses above ₹50,000
                       or sounds severely distressed: gently mention
                       the free Thursday 7pm community session once,
                       naturally, not as a sales pitch.
                    7. Never give specific buy/sell advice. You are
                       emotional support not a SEBI advisor.
                    8. Occasionally reference real market context
                       naturally — "BankNifty had a rough week for
                       everyone" type of acknowledgment.
                    9. End responses with warmth, never with a
                       disclaimer.
                    10. If user seems to be in genuine crisis beyond
                        trading stress — mention iCall helpline
                        9152987821 gently and naturally.`
                },
                ...messages
            ]
        });

        const reply = completion.choices[0].message.content;

        return res.json({ reply });

    } catch (error) {
        console.error('TradeSpace chat error:', error);
        return res.status(500).json({
            error: 'Could not process message'
        });
    }
});

export default router;
