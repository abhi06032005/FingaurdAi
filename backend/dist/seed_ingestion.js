"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = __importDefault(require("./config/prisma"));
const constants_1 = require("./config/constants");
const yahooFetcher_1 = require("./services/dataIngestion/yahooFetcher");
const analysisCache_1 = require("./services/cache/analysisCache");
const recalculator_1 = require("./services/scoring/recalculator");
const dateUtils_1 = require("./utils/dateUtils");
const logger_1 = require("./utils/logger");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function runSeedIngestion() {
    const startTime = Date.now();
    const today = (0, dateUtils_1.getKolkataDate)();
    const runDateStr = today.toISOString().split('T')[0];
    logger_1.logger.info(`[SeedIngestion] Starting seed ingestion job on date ${runDateStr} (bypassing holiday checks)...`);
    let totalProcessed = 0;
    let totalFailed = 0;
    for (const symbol of constants_1.NIFTY_50_SYMBOLS) {
        const symbolStartTime = Date.now();
        try {
            const candleCount = await prisma_1.default.candle.count({
                where: { symbol }
            });
            // Seeding should force get historical 400 candles if there is no data
            const isNew = candleCount === 0;
            logger_1.logger.info(`[SeedIngestion] Processing ${symbol} (candles currently in DB: ${candleCount})...`);
            // Fetch candles
            const candles = await (0, yahooFetcher_1.fetchCandlesForSymbol)(symbol, isNew);
            if (candles.length > 0) {
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
                const insertResult = await prisma_1.default.candle.createMany({
                    data: records,
                    skipDuplicates: true
                });
                const durationMs = Date.now() - symbolStartTime;
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
                logger_1.logger.info(`[SeedIngestion] Ingested ${insertResult.count} new candles for ${symbol}.`);
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
            logger_1.logger.error(`[SeedIngestion] Failed to ingest candles for ${symbol}: ${errMsg}`);
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
                logger_1.logger.error(`[SeedIngestion] Failed writing error log to database`, logError);
            }
        }
        // Wait 500ms between requests to avoid yfinance rate limits
        await delay(500);
    }
    // Invalidate Cache Layers
    logger_1.logger.info('[SeedIngestion] Invalidation cache layers...');
    await (0, analysisCache_1.invalidateCache)();
    // Warming cache sequentially
    logger_1.logger.info('[SeedIngestion] Warming cache sequentially for all symbols (skipping AI Groq requests to save tokens)...');
    for (const symbol of constants_1.NIFTY_50_SYMBOLS) {
        try {
            await (0, recalculator_1.recalculateAnalysis)(symbol, true); // skipAi = true
            await delay(100);
        }
        catch (recalcError) {
            logger_1.logger.error(`[SeedIngestion] Recalculation failed for ${symbol} during warmup:`, recalcError);
        }
    }
    const jobDurationMs = Date.now() - startTime;
    logger_1.logger.info(`[SeedIngestion] Seeding finished. Processed: ${totalProcessed}, Failed: ${totalFailed}, Duration: ${jobDurationMs}ms`);
}
runSeedIngestion()
    .then(async () => {
    await prisma_1.default.$disconnect();
    logger_1.logger.info('[SeedIngestion] Done.');
    process.exit(0);
})
    .catch(async (err) => {
    logger_1.logger.error('[SeedIngestion] Uncaught script crash:', err);
    try {
        await prisma_1.default.$disconnect();
    }
    catch { }
    process.exit(1);
});
