import express, { Request, Response } from 'express';
import { ApifyClient } from 'apify-client';
import Stock from '../models/Stock';
import { processCompany } from '../services/pdfAnnualReport';
import prisma from '../config/prisma';
import { env } from '../config/env';

const router = express.Router();

// NEVER expose admin routes in production
router.use((req: Request, res: Response, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not Found');
  }
  next();
});

router.post('/scrape', async (req: Request, res: Response): Promise<any> => {
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
          const companyName = item.company_name || (item as any).companyName || formattedTicker;

          await Stock.findOneAndUpdate(
            { ticker: formattedTicker },
            { ...item, ticker: formattedTicker, company_name: companyName, lastUpdated: new Date() },
            { upsert: true, new: true }
          );

          console.log(`[Apify] Successfully upserted ${formattedTicker} into MongoDB in background.`);
        } else {
          console.error(`[Apify] Run ${run.id} finished with status: ${runStatus}`);
        }
      } catch (err: any) {
        console.error(`[Apify] Background polling error for Run ID: ${run.id}:`, err.message);
      }
    })();

    return;
  } catch (error: any) {
    console.error('[Apify] Scraper run failed:', error);
    return res.status(500).json({ error: 'Failed to run Apify scraper', details: error.message });
  }
});

router.post('/annual-report/scrape', async (req: Request, res: Response): Promise<any> => {
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
      await processCompany(symbol, isin, { dryRun: !!dryRun });
      console.log(`[Background] Annual report processing completed for ${symbol}`);
    } catch (error: any) {
      console.error(`[Background] Annual report processing failed for ${symbol}:`, error.message);
    }
  })();
});

// Admin Authentication endpoint
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body;
  const adminUsername = env.ADMIN_USERNAME;
  const adminPassword = env.ADMIN_PASSWORD;

  if (username === adminUsername && password === adminPassword) {
    return res.status(200).json({ success: true, token: 'finguard_admin_authenticated' });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});

// Mock companies-status for stock dashboard
router.get('/companies-status', async (req: Request, res: Response): Promise<any> => {
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
  completed: [] as string[],
  failed: [] as string[]
};

router.get('/scrape-status', async (req: Request, res: Response): Promise<any> => {
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

router.post('/scrape-bulk', async (req: Request, res: Response): Promise<any> => {
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

router.post('/scrape-stop', async (req: Request, res: Response): Promise<any> => {
  bulkScrapingActive = false;
  return res.status(200).json({ success: true });
});

// Admin Webinar CRUD Management
router.get('/webinars', async (req: Request, res: Response): Promise<any> => {
  try {
    const webinars = await prisma.webinar.findMany({
      orderBy: { startTime: 'desc' },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });
    return res.status(200).json(webinars);
  } catch (error: any) {
    console.error('[AdminWebinars] Failed to fetch webinars:', error);
    return res.status(500).json({ error: 'Failed to retrieve webinars', details: error.message });
  }
});

router.post('/webinars', async (req: Request, res: Response): Promise<any> => {
  const { title, description, speaker, startTime, endTime, zoomLink, type } = req.body;
  if (!title || !speaker || !startTime || !endTime || !zoomLink) {
    return res.status(400).json({ error: 'Missing required webinar fields' });
  }
  try {
    const webinar = await prisma.webinar.create({
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
  } catch (error: any) {
    console.error('[AdminWebinars] Failed to create webinar:', error);
    return res.status(500).json({ error: 'Failed to create webinar', details: error.message });
  }
});

router.put('/webinars/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { title, description, speaker, startTime, endTime, zoomLink, type } = req.body;
  try {
    const webinar = await prisma.webinar.update({
      where: { id: id as string },
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
  } catch (error: any) {
    console.error('[AdminWebinars] Failed to update webinar:', error);
    return res.status(500).json({ error: 'Failed to update webinar', details: error.message });
  }
});

router.delete('/webinars/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.webinar.delete({
      where: { id: id as string }
    });
    return res.status(200).json({ success: true, message: 'Webinar deleted successfully' });
  } catch (error: any) {
    console.error('[AdminWebinars] Failed to delete webinar:', error);
    return res.status(500).json({ error: 'Failed to delete webinar', details: error.message });
  }
});

// Manual trigger endpoints for heavy jobs
router.post('/jobs/trigger-ingestion', async (req: Request, res: Response): Promise<any> => {
  const { runDailyIngestion } = await import('../jobs/dailyIngestionJob');
  console.log('[AdminRoute] Triggering Daily Ingestion Job manually...');
  res.status(202).json({ success: true, message: 'Daily Ingestion Job triggered in background' });
  (async () => {
    try {
      await runDailyIngestion();
    } catch (err: any) {
      console.error('[AdminRoute] Daily Ingestion Job failed:', err.message);
    }
  })();
});

router.post('/jobs/trigger-metrics', async (req: Request, res: Response): Promise<any> => {
  const { runScreenerMetricsJob } = await import('../jobs/screenerMetricsJob');
  console.log('[AdminRoute] Triggering Screener Metrics Job manually...');
  res.status(202).json({ success: true, message: 'Screener Metrics Job triggered in background' });
  (async () => {
    try {
      await runScreenerMetricsJob();
    } catch (err: any) {
      console.error('[AdminRoute] Screener Metrics Job failed:', err.message);
    }
  })();
});

router.post('/jobs/trigger-vectors', async (req: Request, res: Response): Promise<any> => {
  const { runPatternVectorJob } = await import('../jobs/patternVectorJob');
  console.log('[AdminRoute] Triggering Pattern Vector Job manually...');
  res.status(202).json({ success: true, message: 'Pattern Vector Job triggered in background' });
  (async () => {
    try {
      await runPatternVectorJob();
    } catch (err: any) {
      console.error('[AdminRoute] Pattern Vector Job failed:', err.message);
    }
  })();
});

router.post('/jobs/generate-report', async (req: Request, res: Response): Promise<any> => {
  const { generateAndStoreAIReport } = await import('../services/aiReportService');
  const { ticker, force } = req.body;
  if (!ticker) {
    return res.status(400).json({ error: 'Missing ticker in request body' });
  }
  const symbol = ticker.toUpperCase().trim();
  const forceRegenerate = !!force;
  
  console.log(`[AdminRoute] Triggering AI Report Generation for ${symbol} (force: ${forceRegenerate})...`);
  res.status(202).json({ success: true, message: `AI report generation started for ${symbol}` });
  (async () => {
    try {
      await generateAndStoreAIReport(symbol, forceRegenerate);
    } catch (err: any) {
      console.error(`[AdminRoute] AI Report Generation failed for ${symbol}:`, err.message);
    }
  })();
});

export default router;
