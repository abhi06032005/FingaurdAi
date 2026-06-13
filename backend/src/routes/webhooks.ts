import express, { Request, Response } from 'express';
import { ApifyClient } from 'apify-client';
import Stock from '../models/Stock';
import Payment from '../models/Payment';
import prisma from '../config/prisma';
import crypto from 'crypto';

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

const captureRawBody = (req: any, res: any, next: any) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk: any) => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    if (data) {
      try {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          req.body = JSON.parse(data);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const urlParams = new URLSearchParams(data);
          const parsed: any = {};
          urlParams.forEach((value, key) => {
            parsed[key] = value;
          });
          req.body = parsed;
        }
      } catch (err) {
        console.error('[Webhook Raw Body Parser Error]:', err);
      }
    }
    next();
  });
};

// Razorpay Webhook
router.post('/razorpay/webhook', captureRawBody, async (req: Request, res: Response): Promise<any> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const data = req.body;
    const rawBody = (req as any).rawBody || '';

    let isVerified = false;

    if (webhookSecret && signature) {
      // Validate signature
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (generatedSignature === signature) {
        isVerified = true;
      } else {
        console.warn('[Razorpay Webhook] Signature verification failed. Falling back to API check...');
      }
    } else {
      console.warn('[Razorpay Webhook] Signature or Webhook Secret missing. Falling back to API check...');
    }

    // Fallback: Check Razorpay API directly to confirm status
    if (!isVerified) {
      const paymentEntity = data.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        try {
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || ''
          });
          const rzpOrder = await razorpay.orders.fetch(orderId) as any;
          if (rzpOrder.status === 'paid') {
            isVerified = true;
            console.log(`[Razorpay Webhook] Fallback API check succeeded: Order ${orderId} is paid.`);
          } else {
            console.warn(`[Razorpay Webhook] Fallback API check: Order ${orderId} is not paid (status: ${rzpOrder.status})`);
          }
        } catch (err: any) {
          console.error('[Razorpay Webhook] Fallback API check failed:', err.message);
        }
      }
    }

    if (!isVerified) {
      console.error('[Razorpay Webhook] Verification failed. Rejecting request.');
      return res.status(400).json({ success: false, error: 'Signature and API verification failed' });
    }

    console.log('[Razorpay Webhook] Received Event:', data.event);

    // Process order.paid or payment.captured
    if (data.event === 'order.paid' || data.event === 'payment.captured') {
      const paymentEntity = data.payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const customerEmail = paymentEntity?.email;

      console.log(`[Razorpay Webhook] Success event for Order: ${orderId}, Payment: ${paymentId}`);

      if (customerEmail) {
        console.log(`[Razorpay Webhook] Upgrading user plan for email: ${customerEmail}`);
        
        // Find user by email in Neon DB via Prisma
        const user = await prisma.user.findUnique({
          where: { email: customerEmail }
        });

        if (user) {
          // Find payment to identify standard or premium plan
          const payment = await Payment.findOne({ orderId });
          const planToUpgrade = payment?.plan || 'STANDARD';

          const startDate = new Date();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);

          await prisma.user.update({
            where: { email: customerEmail },
            data: {
              plan: planToUpgrade,
              planStartDate: startDate,
              planExpiryDate: expiryDate,
              isPremium: planToUpgrade === 'PREMIUM',
              reportsUsed: 0
            }
          });
          
          if (payment) {
            payment.status = 'SUCCESS';
            payment.processed = true;
            payment.paymentGatewayId = paymentId;
            await payment.save();
          }

          console.log(`[Razorpay Webhook] User ${customerEmail} successfully upgraded to ${planToUpgrade}.`);
        } else {
          console.warn(`[Razorpay Webhook] User with email ${customerEmail} not found in Neon DB.`);
        }
      } else {
        console.warn(`[Razorpay Webhook] No customer email found in webhook payload.`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


export default router;
