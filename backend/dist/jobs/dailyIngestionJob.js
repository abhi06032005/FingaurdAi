"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDailyIngestion = runDailyIngestion;
exports.scheduleDailyIngestionJob = scheduleDailyIngestionJob;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../config/prisma"));
const constants_1 = require("../config/constants");
const yahooFetcher_1 = require("../services/dataIngestion/yahooFetcher");
const analysisCache_1 = require("../services/cache/analysisCache");
const recalculator_1 = require("../services/scoring/recalculator");
const dateUtils_1 = require("../utils/dateUtils");
const logger_1 = require("../utils/logger");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Runs the daily NIFTY 50 stock market ingestion process.
 */
async function runDailyIngestion() {
    const startTime = Date.now();
    const today = (0, dateUtils_1.getKolkataDate)();
    const runDateStr = today.toISOString().split('T')[0];
    logger_1.logger.info(`[DailyIngestionJob] Starting ingestion job for ${runDateStr}`);
    // Skip if today is a weekend or listed NSE holiday
    if ((0, dateUtils_1.isMarketHolidayOrWeekend)(today)) {
        logger_1.logger.info(`[DailyIngestionJob] Skipping execution: today (${runDateStr}) is a market holiday or weekend.`);
        return;
    }
    let totalProcessed = 0;
    let totalFailed = 0;
    for (const symbol of constants_1.NIFTY_50_SYMBOLS) {
        const symbolStartTime = Date.now();
        try {
            // Check if this symbol already has candles in the database
            const candleCount = await prisma_1.default.candle.count({
                where: { symbol }
            });
            const isNew = candleCount === 0;
            // Fetch candles (400 days if new symbol, 5 days if existing to handle latency and weekends)
            const candles = await (0, yahooFetcher_1.fetchCandlesForSymbol)(symbol, isNew);
            if (candles.length > 0) {
                // Prepare prisma rows
                const records = candles.map((c) => ({
                    symbol: c.symbol,
                    date: c.date,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume,
                    dataQuality: c.dataQuality
                }));
                // Bulk insert to PostgreSQL, skipping matching primary keys
                const insertResult = await prisma_1.default.candle.createMany({
                    data: records,
                    skipDuplicates: true
                });
                const durationMs = Date.now() - symbolStartTime;
                // Log success in database IngestionLog
                await prisma_1.default.ingestionLog.create({
                    data: {
                        symbol,
                        runDate: today,
                        status: 'success',
                        candlesFetched: insertResult.count,
                        durationMs
                    }
                });
                totalProcessed++;
                logger_1.logger.info(`[DailyIngestionJob] Ingested ${insertResult.count} candles for ${symbol} successfully.`);
            }
            else {
                await prisma_1.default.ingestionLog.create({
                    data: {
                        symbol,
                        runDate: today,
                        status: 'skipped',
                        errorMessage: 'No new candles found'
                    }
                });
                totalProcessed++;
            }
        }
        catch (err) {
            totalFailed++;
            const errMsg = err instanceof Error ? err.message : String(err);
            const durationMs = Date.now() - symbolStartTime;
            logger_1.logger.error(`[DailyIngestionJob] Failed to ingest candles for ${symbol}: ${errMsg}`, { symbol, err });
            try {
                await prisma_1.default.ingestionLog.create({
                    data: {
                        symbol,
                        runDate: today,
                        status: 'failed',
                        errorMessage: errMsg,
                        durationMs
                    }
                });
            }
            catch (logError) {
                logger_1.logger.error(`[DailyIngestionJob] Failed writing error log to database`, logError);
            }
        }
        // Wait 500ms between requests to avoid rate limits
        await delay(500);
    }
    // 2. Invalidate Cache Layers after fetching completes
    logger_1.logger.info('[DailyIngestionJob] Ingest completes. Invalidating cache layers...');
    await (0, analysisCache_1.invalidateCache)();
    // 3. Recalculate analysis for all 50 symbols to warm caches and create ScoreHistory
    logger_1.logger.info('[DailyIngestionJob] Warming cache by recalculating all 50 symbols sequentially...');
    for (const symbol of constants_1.NIFTY_50_SYMBOLS) {
        try {
            await (0, recalculator_1.recalculateAnalysis)(symbol, true);
            await delay(100);
        }
        catch (recalcError) {
            logger_1.logger.error(`[DailyIngestionJob] Recalculation failed for ${symbol} during post-ingest warmup`, { symbol, recalcError });
        }
    }
    const jobDurationMs = Date.now() - startTime;
    logger_1.logger.info(`[DailyIngestionJob] Ingestion job finished. Processed: ${totalProcessed}, Failed: ${totalFailed}, Total Duration: ${jobDurationMs}ms`);
}
/**
 * Initializes the node-cron scheduler for the daily ingestion task.
 * Scheduled to run at 15:45 (3:45 PM) Asia/Kolkata timezone, Monday through Friday.
 */
function scheduleDailyIngestionJob() {
    node_cron_1.default.schedule('45 15 * * 1-5', async () => {
        logger_1.logger.info('[Scheduler] Triggering scheduled Daily Market Ingestion Job...');
        try {
            await runDailyIngestion();
        }
        catch (jobError) {
            logger_1.logger.error('[Scheduler] Scheduled Daily Market Ingestion Job encountered an uncaught error:', jobError);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });
    logger_1.logger.info('[Scheduler] Daily Ingestion Job successfully scheduled at 15:45 IST Weekdays.');
}
