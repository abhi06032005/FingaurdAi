import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { errorHandler } from './middlewares/errorHandler';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import tradeRoutes from './routes/trades';
import scamRoutes from './routes/scams';
import newsRoutes from './routes/newsRoutes';
import aiReportRoutes from './routes/aiReports';
import { initCronJobs } from './services/cronService';

const app = express();

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('[app] Connected to MongoDB for Stock Data');
      // Initialize background news fetch & cleanup cron tasks once database is connected
      initCronJobs();
    })
    .catch(err => console.error('[app] MongoDB connection error:', err));
} else {
  console.warn('[app] MONGO_URI not found in environment variables. Stock DB will not connect.');
}

app.use(helmet());
app.use(cors());

// Webhooks (supporting both /webhooks/apify and root /apify for compatibility)
app.use('/webhooks', webhookRoutes);
app.use('/', webhookRoutes);

app.use(express.json());

// Mount admin routes
app.use('/admin', adminRoutes);
app.use('/trades', tradeRoutes);
app.use('/scam-platform', scamRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai-reports', aiReportRoutes);

// Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;
