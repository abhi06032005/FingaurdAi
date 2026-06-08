"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apify_client_1 = require("apify-client");
const Stock_1 = __importDefault(require("../models/Stock"));
const pdfAnnualReport_1 = require("../services/pdfAnnualReport");
const router = express_1.default.Router();
router.post('/scrape', async (req, res) => {
    const { ticker } = req.body;
    if (!ticker) {
        return res.status(400).json({ error: 'Missing ticker in request body' });
    }
    const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_API_TOKEN) {
        return res.status(500).json({ error: 'Missing APIFY_API_TOKEN' });
    }
    try {
        const client = new apify_client_1.ApifyClient({ token: APIFY_API_TOKEN });
        const formattedTicker = ticker.toUpperCase();
        const url = `https://www.screener.in/company/${formattedTicker}/`;
        console.log(`[Apify] Triggering screener-in actor for ${formattedTicker} (${url})...`);
        // Start the actor run asynchronously
        const run = await client.actor('shashwattrivedi/screener-in').start({
            mode: 'getstockdetails',
            url: url,
        });
        console.log(`[Apify] Scraper run started in background. Run ID: ${run.id}`);
        // Return response immediately to prevent HTTP timeouts
        res.status(202).json({
            success: true,
            message: `Scraper run started in the background for ${formattedTicker}`,
            runId: run.id,
        });
        // Run the background polling to fetch results and save them
        (async () => {
            try {
                let runStatus = run.status;
                console.log(`[Apify] Background polling started for Run ID: ${run.id}`);
                while (runStatus === 'RUNNING' || runStatus === 'READY') {
                    // Wait 5 seconds between checks
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    const currentRun = await client.run(run.id).get();
                    if (!currentRun) {
                        console.error(`[Apify] Failed to fetch run details for Run ID: ${run.id}`);
                        return;
                    }
                    runStatus = currentRun.status;
                }
                if (runStatus === 'SUCCEEDED') {
                    console.log(`[Apify] Run ${run.id} succeeded. Fetching dataset items...`);
                    const currentRun = await client.run(run.id).get();
                    const datasetId = currentRun?.defaultDatasetId;
                    if (!datasetId) {
                        console.error(`[Apify] No dataset ID found for Run ID: ${run.id}`);
                        return;
                    }
                    const { items } = await client.dataset(datasetId).listItems();
                    if (!items || items.length === 0) {
                        console.error(`[Apify] No items found in dataset ${datasetId} for Run ID: ${run.id}`);
                        return;
                    }
                    const item = items[0];
                    const companyName = item.company_name || item.companyName || formattedTicker;
                    await Stock_1.default.findOneAndUpdate({ ticker: formattedTicker }, { ...item, ticker: formattedTicker, company_name: companyName, lastUpdated: new Date() }, { upsert: true, new: true });
                    console.log(`[Apify] Successfully upserted ${formattedTicker} into MongoDB in background.`);
                }
                else {
                    console.error(`[Apify] Run ${run.id} finished with status: ${runStatus}`);
                }
            }
            catch (err) {
                console.error(`[Apify] Background polling error for Run ID: ${run.id}:`, err.message);
            }
        })();
        return;
    }
    catch (error) {
        console.error('[Apify] Scraper run failed:', error);
        return res.status(500).json({ error: 'Failed to run Apify scraper', details: error.message });
    }
});
router.post('/annual-report/scrape', async (req, res) => {
    const { symbol, isin, dryRun } = req.body;
    if (!symbol) {
        return res.status(400).json({ error: 'Missing symbol in request body' });
    }
    // Respond immediately to prevent HTTP timeouts
    res.status(202).json({
        success: true,
        message: `Annual report scraper and extraction started in background for ${symbol}`,
    });
    // Run in background
    (async () => {
        try {
            console.log(`[Background] Starting annual report processing for ${symbol}`);
            await (0, pdfAnnualReport_1.processCompany)(symbol, isin, { dryRun: !!dryRun });
            console.log(`[Background] Annual report processing completed for ${symbol}`);
        }
        catch (error) {
            console.error(`[Background] Annual report processing failed for ${symbol}:`, error.message);
        }
    })();
});
exports.default = router;
