import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { errorHandler } from './middlewares/errorHandler';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import tradeRoutes from './routes/trades';
import scamRoutes from './routes/scams';

const app = express();

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('[app] Connected to MongoDB for Stock Data'))
    .catch(err => console.error('[app] MongoDB connection error:', err));
} else {
  console.warn('[app] MONGO_URI not found in environment variables. Stock DB will not connect.');
}

app.use(helmet());
app.use(cors());

// Webhooks
app.use('/webhooks', webhookRoutes);

app.use(express.json());

// Mount admin routes
app.use('/admin', adminRoutes);
app.use('/trades', tradeRoutes);
app.use('/scam-platform', scamRoutes);

// Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;
