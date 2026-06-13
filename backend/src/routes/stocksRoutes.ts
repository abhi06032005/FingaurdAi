import express, { Request, Response } from 'express';
import Stock from '../models/Stock';

const router = express.Router();

/**
 * GET /api/stocks
 * List all available tickers with basic info (no heavy data).
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const stocks = await Stock.find(
      {},
      { ticker: 1, company_name: 1, lastUpdated: 1 }
    )
      .sort({ lastUpdated: -1 })
      .lean();

    return res.status(200).json({ success: true, count: stocks.length, stocks });
  } catch (err: any) {
    console.error('[StocksRoute] GET / error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/stocks/:ticker
 * Fetch full stock document (screener data) for a given ticker.
 */
router.get('/:ticker', async (req: Request, res: Response): Promise<any> => {
  const symbol = (req.params.ticker as string).toUpperCase().trim();

  try {
    const stock = await Stock.findOne({ ticker: symbol }).lean();

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: `No stock data found for ${symbol}. Trigger scraping via POST /admin/scrape`,
        ticker: symbol,
      });
    }

    return res.status(200).json({ success: true, ticker: symbol, ...(stock as any) });
  } catch (err: any) {
    console.error(`[StocksRoute] GET /${symbol} error:`, err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
