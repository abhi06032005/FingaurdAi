import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { initCronJobs } from './services/cronService';
import { scheduleDailyIngestionJob } from './jobs/dailyIngestionJob';
import { scheduleWeeklyCleanupJob } from './jobs/weeklyCleanupJob';
import { scheduleScreenerMetricsJob } from './jobs/screenerMetricsJob';
import { schedulePatternVectorJob } from './jobs/patternVectorJob';
import adminRoutes from './routes/admin';
import internalRoutes from './routes/internal';

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*', // Allow all dashboard/API client calls
  credentials: true,
}));

app.use(express.json());

// Mount routes
app.use('/admin', adminRoutes);
app.use('/internal', internalRoutes);

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('[Admin Server] Connected to MongoDB for Stock Data');
      // Initialize background news fetch & cleanup cron tasks once database is connected
      initCronJobs();
    })
    .catch(err => console.error('[Admin Server] MongoDB connection error:', err));
} else {
  console.warn('[Admin Server] MONGO_URI not found in environment variables. Stock DB will not connect.');
}

// Initialize Neon/Prisma jobs (independent of MongoDB) only if explicitly enabled
if (process.env.ENABLE_AUTOMATIC_CRON === 'true') {
  console.log('[Admin Server] Enabling automatic scheduled background jobs...');
  scheduleDailyIngestionJob();
  scheduleWeeklyCleanupJob();
  scheduleScreenerMetricsJob();
  schedulePatternVectorJob();
} else {
  console.log('[Admin Server] Automatic background cron jobs are disabled. Jobs can only be triggered manually from the admin panel.');
}

// Start Server
const PORT = env.PORT;
const server = app.listen(PORT, () => {
  console.log(`🚀 Admin and Jobs Service is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
