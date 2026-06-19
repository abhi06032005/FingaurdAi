import Razorpay from 'razorpay';
import prisma from '../config/prisma';
import Payment from '../models/Payment';

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
  console.log(`[Reconciliation Upgrade] Upgraded user ${clerkUserId} to ${plan}. Expiry: ${expiryDate}`);
};

/**
 * Background Reconciliation Function (checks stuck/pending payments with Razorpay)
 */
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
