import express, { Request, Response } from 'express';
import { ApifyClient } from 'apify-client';
import Stock from '../models/Stock';

const router = express.Router();

// Apify Stock Scraping & Sync
router.post('/apify', express.json(), async (req: Request, res: Response): Promise<any> => {
  const { ticker } = req.body;
  if (!ticker) {
    return res.status(400).json({ error: 'Missing ticker in request body' });
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  if (!APIFY_API_TOKEN) {
    return res.status(500).json({ error: 'Missing APIFY_API_TOKEN' });
  }

  try {
    const client = new ApifyClient({ token: APIFY_API_TOKEN });
    const formattedTicker = ticker.toUpperCase();
    const url = `https://www.screener.in/company/${formattedTicker}/consolidated/`;

    console.log(`[Webhook] Triggering Apify actor for ${formattedTicker} (${url})...`);

    // Call the actor and wait for completion
    const run = await client.actor('shashwattrivedi/screener-in').call({
      mode: 'getstockdetails',
      url: url,
    });

    if (run.status !== 'SUCCEEDED') {
      return res.status(502).json({ error: `Apify run failed with status: ${run.status}` });
    }

    const datasetId = run.defaultDatasetId;
    if (!datasetId) {
      return res.status(502).json({ error: 'No dataset ID found in completed run' });
    }

    // Fetch the scraped items
    const { items } = await client.dataset(datasetId).listItems();
    if (!items || items.length === 0) {
      return res.status(502).json({ error: 'No items returned from scraper' });
    }

    const item = items[0];
    const companyName = item.company_name || (item as any).companyName || formattedTicker;

    // Upsert into MongoDB
    const savedStock = await Stock.findOneAndUpdate(
      { ticker: formattedTicker },
      { ...item, ticker: formattedTicker, company_name: companyName, lastUpdated: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`[Webhook] Successfully upserted ${formattedTicker} into MongoDB.`);
    return res.status(200).json({ success: true, message: `Synced ${formattedTicker}`, data: savedStock });
  } catch (error: any) {
    console.error('[Webhook] Apify sync failed:', error);
    return res.status(500).json({ error: 'Failed to sync Apify data', details: error.message });
  }
});

export default router;
