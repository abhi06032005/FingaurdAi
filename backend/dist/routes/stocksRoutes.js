"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Stock_1 = __importDefault(require("../models/Stock"));
const router = express_1.default.Router();
/**
 * GET /api/stocks
 * List all available tickers with basic info (no heavy data).
 */
router.get('/', async (_req, res) => {
    try {
        const stocks = await Stock_1.default.find({}, { ticker: 1, company_name: 1, lastUpdated: 1 })
            .sort({ lastUpdated: -1 })
            .lean();
        return res.status(200).json({ success: true, count: stocks.length, stocks });
    }
    catch (err) {
        console.error('[StocksRoute] GET / error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
/**
 * GET /api/stocks/:ticker
 * Fetch full stock document (screener data) for a given ticker.
 */
router.get('/:ticker', async (req, res) => {
    const symbol = req.params.ticker.toUpperCase().trim();
    try {
        const stock = await Stock_1.default.findOne({ ticker: symbol }).lean();
        if (!stock) {
            return res.status(404).json({
                success: false,
                error: `No stock data found for ${symbol}. Trigger scraping via POST /admin/scrape`,
                ticker: symbol,
            });
        }
        return res.status(200).json({ success: true, ticker: symbol, ...stock });
    }
    catch (err) {
        console.error(`[StocksRoute] GET /${symbol} error:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
