import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { errorHandler } from './middlewares/errorHandler';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import tradeRoutes from './routes/trades';
import aiReportRoutes from './routes/aiReports';
import stocksRoutes from './routes/stocksRoutes';
import userRoutes from './routes/users';
import paymentRoutes from './routes/payments';
import { initCronJobs } from './services/cronService';
import { scheduleDailyIngestionJob } from './jobs/dailyIngestionJob';
import { scheduleWeeklyCleanupJob } from './jobs/weeklyCleanupJob';
import technicalAnalysisRouter from './routes/technicalAnalysis';
import rateLimit from 'express-rate-limit';
import { authenticate } from './middlewares/authMiddleware';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('[app] Connected to MongoDB for Stock Data');
      // Initialize background news fetch & cleanup cron tasks once database is connected
      initCronJobs();
      // Initialize daily ingestion and weekly database maintenance crons
      scheduleDailyIngestionJob();
      scheduleWeeklyCleanupJob();
    })
    .catch(err => console.error('[app] MongoDB connection error:', err));
} else {
  console.warn('[app] MONGO_URI not found in environment variables. Stock DB will not connect.');
}

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Webhooks (supporting both /webhooks/apify and root /apify for compatibility)
app.use('/webhooks', webhookRoutes);
app.use('/', webhookRoutes);

app.use(express.json());
app.use(clerkMiddleware());

// Mount protected routes with authenticate middleware
app.use('/admin', adminRoutes);
app.use('/trades', authenticate, tradeRoutes);
app.use('/api/ai-reports', aiReportRoutes);
app.use('/api/stocks', technicalAnalysisRouter);
app.use('/api/stocks', stocksRoutes); // Usually public
app.use('/api/users', authenticate, userRoutes);
app.use('/api/payments', authenticate, paymentRoutes);


// Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;
