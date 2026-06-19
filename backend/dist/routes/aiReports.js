"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CompanyAIReport_1 = require("../models/CompanyAIReport");
const Stock_1 = __importDefault(require("../models/Stock"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const generative_ai_1 = require("@google/generative-ai");
const geminiRateLimiter_1 = require("../utils/geminiRateLimiter");
function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    return new generative_ai_1.GoogleGenerativeAI(apiKey);
}
const router = express_1.default.Router();
/**
// Generation is handled solely by the admin panel dashboard.

/**
 * GET /api/ai-reports/:ticker
 *
 * Fetch the precomputed AI report for a company.
 * Returns the full report document from company_ai_reports, along with the raw stock data.
 */
router.get('/:ticker', async (req, res) => {
    const symbol = req.params.ticker.toUpperCase().trim();
    try {
        const [report, stock] = await Promise.all([
            CompanyAIReport_1.CompanyAIReport.findOne({ ticker: symbol }).lean(),
            Stock_1.default.findOne({ ticker: symbol }).lean()
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
    }
    catch (err) {
        console.error(`[AIReport Route] GET /${symbol} error:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
/**
 * GET /api/ai-reports
 *
 * List all available AI reports (summary view, no raw_groq_response).
 */
router.get('/', async (_req, res) => {
    try {
        const reports = await CompanyAIReport_1.CompanyAIReport.find({}, {
            ticker: 1,
            company_name: 1,
            generated_at: 1,
            data_sources: 1,
            'executive_summary.one_liner': 1,
            'business_quality_score.overall_score': 1,
            'industry_context.sector': 1,
            generation_error: 1,
        })
            .sort({ generated_at: -1 })
            .lean();
        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    }
    catch (err) {
        console.error('[AIReport Route] GET / error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
/**
 * DELETE /api/ai-reports/:ticker
 *
 * Delete the cached AI report for a company (to force fresh regeneration).
 */
router.delete('/:ticker', authMiddleware_1.authenticate, async (req, res) => {
    const symbol = req.params.ticker.toUpperCase().trim();
    try {
        const result = await CompanyAIReport_1.CompanyAIReport.deleteOne({ ticker: symbol });
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
    }
    catch (err) {
        console.error(`[AIReport Route] DELETE /${symbol} error:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
/**
 * POST /api/ai-reports/generate
 *
 * Trigger generation of the AI report for a company by delegating to the Admin service.
 */
router.post('/generate', async (req, res) => {
    const { ticker } = req.body;
    if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid "ticker" in request body.',
        });
    }
    const symbol = ticker.toUpperCase().trim();
    const adminUrl = process.env.ADMIN_SERVICE_URL || 'http://localhost:5001';
    try {
        console.log(`[AIReport Route] Proxying generation request for ${symbol} to Admin backend...`);
        const response = await fetch(`${adminUrl}/internal/generate-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker: symbol, force: true }),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                success: false,
                error: errData.error || `Admin service responded with status ${response.status}`,
            });
        }
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (err) {
        console.error(`[AIReport Route] POST /generate proxy error:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
/**
 * POST /api/ai-reports/chat
 *
 * Empathy-first chat session for Indian retail traders using Llama-3.3-70b-versatile.
 */
router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'messages array required'
            });
        }
        const formattedMessages = messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content || m.text || '' }]
        }));
        const response = await (0, geminiRateLimiter_1.geminiQueue)((genAI) => {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: `You are TradeSpace Guide — an empathetic
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
            });
            return model.generateContent({
                contents: formattedMessages,
                generationConfig: {
                    maxOutputTokens: 300,
                    temperature: 0.85,
                }
            });
        });
        const reply = response.response.text()?.trim() ?? '';
        return res.json({ reply });
    }
    catch (error) {
        console.error('TradeSpace chat error:', error);
        return res.status(500).json({
            error: 'Could not process message'
        });
    }
});
exports.default = router;
