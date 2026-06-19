"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apify_client_1 = require("apify-client");
const Stock_1 = __importDefault(require("../models/Stock"));
const pdfAnnualReport_1 = require("../services/pdfAnnualReport");
const prisma_1 = __importDefault(require("../config/prisma"));
const router = express_1.default.Router();
// NEVER expose admin routes in production
router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).send('Not Found');
    }
    next();
});
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
        const url = `https://www.screener.in/company/${formattedTicker}/consolidated/`;
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
// Admin Authentication endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const adminUsername = 'abhijeet06032005';
    const adminPassword = '@bhijeet';
    if (username === adminUsername && password === adminPassword) {
        return res.status(200).json({ success: true, token: 'finguard_admin_authenticated' });
    }
    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});
// Mock companies-status for stock dashboard
router.get('/companies-status', async (req, res) => {
    const mockTickers = [
        { ticker: 'RELIANCE', status: 'Completed', lastUpdated: new Date(Date.now() - 3600000 * 24).toISOString() },
        { ticker: 'TCS', status: 'Completed', lastUpdated: new Date(Date.now() - 3600000 * 12).toISOString() },
        { ticker: 'INFY', status: 'Completed', lastUpdated: new Date(Date.now() - 3600000 * 48).toISOString() },
        { ticker: 'HDFCBANK', status: 'Completed', lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString() },
        { ticker: 'ICICIBANK', status: 'Pending', lastUpdated: null },
        { ticker: 'BHARTIARTL', status: 'Pending', lastUpdated: null },
        { ticker: 'ITC', status: 'Failed', lastUpdated: null },
        { ticker: 'SBIN', status: 'Pending', lastUpdated: null },
        { ticker: 'LTI', status: 'Pending', lastUpdated: null },
        { ticker: 'HINDUNILVR', status: 'Pending', lastUpdated: null }
    ];
    return res.status(200).json(mockTickers);
});
// Mock scrape-status for stock dashboard
let bulkScrapingActive = false;
let bulkProgress = {
    total: 10,
    current: 0,
    ticker: '',
    completed: [],
    failed: []
};
router.get('/scrape-status', async (req, res) => {
    if (bulkScrapingActive && bulkProgress.current < bulkProgress.total) {
        // Simulate background progress
        bulkProgress.current += 1;
        const pendingTickers = ['ICICIBANK', 'BHARTIARTL', 'SBIN', 'LTI', 'HINDUNILVR'];
        const nextTicker = pendingTickers[bulkProgress.current - 1] || 'DONE';
        bulkProgress.ticker = nextTicker;
        if (nextTicker !== 'DONE') {
            bulkProgress.completed.push(nextTicker);
        }
        if (bulkProgress.current === bulkProgress.total) {
            bulkScrapingActive = false;
        }
    }
    return res.status(200).json({
        isBulkScraping: bulkScrapingActive,
        progress: bulkProgress
    });
});
router.post('/scrape-bulk', async (req, res) => {
    bulkScrapingActive = true;
    bulkProgress = {
        total: 5,
        current: 0,
        ticker: 'ICICIBANK',
        completed: [],
        failed: []
    };
    return res.status(200).json({ success: true, total: 5 });
});
router.post('/scrape-stop', async (req, res) => {
    bulkScrapingActive = false;
    return res.status(200).json({ success: true });
});
// Admin Webinar CRUD Management
router.get('/webinars', async (req, res) => {
    try {
        const webinars = await prisma_1.default.webinar.findMany({
            orderBy: { startTime: 'desc' },
            include: {
                _count: {
                    select: { registrations: true }
                }
            }
        });
        return res.status(200).json(webinars);
    }
    catch (error) {
        console.error('[AdminWebinars] Failed to fetch webinars:', error);
        return res.status(500).json({ error: 'Failed to retrieve webinars', details: error.message });
    }
});
router.post('/webinars', async (req, res) => {
    const { title, description, speaker, startTime, endTime, zoomLink, type } = req.body;
    if (!title || !speaker || !startTime || !endTime || !zoomLink) {
        return res.status(400).json({ error: 'Missing required webinar fields' });
    }
    try {
        const webinar = await prisma_1.default.webinar.create({
            data: {
                title,
                description: description || '',
                speaker,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                zoomLink,
                type: type === 'PREMIUM' ? 'PREMIUM' : 'FREE'
            }
        });
        return res.status(201).json({ success: true, data: webinar });
    }
    catch (error) {
        console.error('[AdminWebinars] Failed to create webinar:', error);
        return res.status(500).json({ error: 'Failed to create webinar', details: error.message });
    }
});
router.put('/webinars/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, speaker, startTime, endTime, zoomLink, type } = req.body;
    try {
        const webinar = await prisma_1.default.webinar.update({
            where: { id: id },
            data: {
                title,
                description,
                speaker,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                zoomLink,
                type
            }
        });
        return res.status(200).json({ success: true, data: webinar });
    }
    catch (error) {
        console.error('[AdminWebinars] Failed to update webinar:', error);
        return res.status(500).json({ error: 'Failed to update webinar', details: error.message });
    }
});
router.delete('/webinars/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.default.webinar.delete({
            where: { id: id }
        });
        return res.status(200).json({ success: true, message: 'Webinar deleted successfully' });
    }
    catch (error) {
        console.error('[AdminWebinars] Failed to delete webinar:', error);
        return res.status(500).json({ error: 'Failed to delete webinar', details: error.message });
    }
});
exports.default = router;
