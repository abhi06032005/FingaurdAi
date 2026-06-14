import express, { Request, Response } from 'express';
import Razorpay from 'razorpay';
import prisma from '../config/prisma';
import Payment from '../models/Payment';

const router = express.Router();

// 1. POST /create-order
router.post('/create-order', express.json(), async (req: Request, res: Response): Promise<any> => {
  const { email, plan, contact } = req.body;
  const userId = (req as any).auth?.userId;

  if (!userId || !email || !plan) {
    return res.status(400).json({ error: 'Missing required parameters: email, plan or authentication token' });
  }

  if (plan !== 'STANDARD' && plan !== 'PREMIUM') {
    return res.status(400).json({ error: 'Invalid plan selected. Must be STANDARD or PREMIUM' });
  }

  const price = plan === 'PREMIUM' ? 199.00 : 99.00;

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    });

    const options = {
      amount: price * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
    };

    const rzpOrder = await razorpay.orders.create(options) as any;

    // Store in MongoDB as PENDING
    await Payment.create({
      userId,
      orderId: rzpOrder.id,
      amount: price,
      plan,
      contact: contact || null,
      status: 'PENDING'
    });

    console.log(`[Payments] Order created for user ${userId}. ID: ${rzpOrder.id}`);

    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      amount: price * 100,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error('[Payments] Create Order error:', error);
    return res.status(500).json({ error: error.message || 'Failed to initialize payment session' });
  }
});

// Helper to upgrade user in Neon PostgreSQL DB
const upgradeUserPlan = async (clerkUserId: string, plan: 'STANDARD' | 'PREMIUM') => {
  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days duration

  await prisma.user.update({
    where: { clerkUserId },
    data: {
      plan,
      planStartDate: startDate,
      planExpiryDate: expiryDate,
      isPremium: plan === 'PREMIUM',
      reportsUsed: 0
    }
  });
  console.log(`[Prisma Upgrade] Upgraded user ${clerkUserId} to ${plan}. Expiry: ${expiryDate}`);
};

// 2. GET /verify/:orderId
router.get('/verify/:orderId', async (req: Request, res: Response): Promise<any> => {
  const { orderId } = req.params;
  const userId = (req as any).auth?.userId;

  try {
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Ensure the authenticated user owns this payment record
    if (payment.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to verify this order' });
    }

    if (payment.processed && payment.status === 'SUCCESS') {
      return res.status(200).json({ success: true, message: 'Payment already verified.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    });

    const rzpOrder = await razorpay.orders.fetch(orderId as string) as any;

    if (rzpOrder.status === 'paid') {
      payment.status = 'SUCCESS';
      payment.processed = true;
      await payment.save();

      await upgradeUserPlan(payment.userId, payment.plan);

      return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
    } else {
      if (rzpOrder.status === 'attempted' || rzpOrder.status === 'created') {
        return res.status(400).json({ error: `Payment not completed yet. Status: ${rzpOrder.status}` });
      }
      
      payment.status = 'FAILED';
      payment.processed = true;
      await payment.save();

      return res.status(400).json({ error: `Payment failed. Razorpay Status: ${rzpOrder.status}` });
    }
  } catch (error: any) {
    console.error('[Payments] Verify Order error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

// 3. POST /webhook-verify 
router.post('/webhook-verify', express.json(), async (req: Request, res: Response): Promise<any> => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
         return res.status(400).json({ error: 'Missing payment details' });
    }

    try {
        const crypto = require('crypto');
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            const payment = await Payment.findOne({ orderId: razorpay_order_id });
            if (payment && !payment.processed) {
                payment.status = 'SUCCESS';
                payment.processed = true;
                payment.paymentGatewayId = razorpay_payment_id;
                await payment.save();

                await upgradeUserPlan(payment.userId, payment.plan);
            }
            return res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
             return res.status(400).json({ success: false, error: 'Signature validation failed' });
        }
    } catch (error: any) {
         return res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Background Reconciliation Function (checks stuck/pending payments with Razorpay)
export async function reconcilePendingPayments() {
  try {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Auto-expire/fail pending payments older than 24 hours so we don't query them again
    const expireResult = await Payment.updateMany(
      {
        status: 'PENDING',
        createdAt: { $lt: twentyFourHoursAgo }
      },
      {
        status: 'FAILED',
        processed: true
      }
    );
    if (expireResult.modifiedCount > 0) {
      console.log(`[Reconciliation] Auto-expired ${expireResult.modifiedCount} old pending payments older than 24 hours.`);
    }

    // Only query Razorpay for pending payments created between 3 minutes and 24 hours ago
    const pendingPayments = await Payment.find({
      status: 'PENDING',
      createdAt: { $gt: twentyFourHoursAgo, $lt: threeMinutesAgo }
    });

    if (pendingPayments.length === 0) return;

    console.log(`[Reconciliation] Found ${pendingPayments.length} pending payments to reconcile.`);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    });

    for (const payment of pendingPayments) {
      try {
        console.log(`[Reconciliation] Verifying status for Order: ${payment.orderId}`);
        const rzpOrder = await razorpay.orders.fetch(payment.orderId) as any;

        if (rzpOrder.status === 'paid') {
          payment.status = 'SUCCESS';
          payment.processed = true;
          await payment.save();

          await upgradeUserPlan(payment.userId, payment.plan);
          console.log(`[Reconciliation] Order ${payment.orderId} was paid. Successfully upgraded user: ${payment.userId}`);
        } else if (rzpOrder.status === 'attempted' || rzpOrder.status === 'created') {
          // Still waiting for completion, no action needed
          console.log(`[Reconciliation] Order ${payment.orderId} is still pending: ${rzpOrder.status}`);
        } else {
          // Failed or Expired
          payment.status = 'FAILED';
          payment.processed = true;
          await payment.save();
          console.log(`[Reconciliation] Order ${payment.orderId} has failed/expired status: ${rzpOrder.status}`);
        }
      } catch (err: any) {
        const errMsg = err.message || (err.error && err.error.description) || String(err);
        console.error(`[Reconciliation] Failed checking Order ${payment.orderId}:`, errMsg);
        
        // If order does not exist or is invalid, mark it as failed to avoid looping forever
        const statusCode = err.statusCode || (err.error && err.error.code);
        if (statusCode === 400 || statusCode === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('invalid')) {
          payment.status = 'FAILED';
          payment.processed = true;
          await payment.save();
          console.log(`[Reconciliation] Order ${payment.orderId} marked as FAILED due to invalid/non-existent status.`);
        }
      }
    }
  } catch (error: any) {
    console.error('[Reconciliation Error]:', error);
  }
}

export default router;

