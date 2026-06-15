"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedAnalysis = getCachedAnalysis;
exports.setCachedAnalysis = setCachedAnalysis;
exports.invalidateCache = invalidateCache;
const node_cache_1 = __importDefault(require("node-cache"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = require("../../utils/logger");
const mathUtils_1 = require("../../utils/mathUtils");
// Layer 1 - In-Memory Cache (TTL: 1 hour)
const memoryCache = new node_cache_1.default({ stdTTL: 3600, checkperiod: 120 });
/**
 * Retreives the cached technical analysis results.
 * Check Memory Cache -> Check PostgreSQL Cache -> Return null if miss.
 */
async function getCachedAnalysis(symbol) {
    const memKey = `ta:${symbol}`;
    // 1. Check Memory Cache
    const memoryHit = memoryCache.get(memKey);
    if (memoryHit) {
        logger_1.logger.info(`Layer 1 Memory cache hit for ${symbol}`);
        return memoryHit;
    }
    // 2. Check Database Cache
    try {
        const dbCache = await prisma_1.default.technicalAnalysisCache.findUnique({
            where: { symbol }
        });
        if (dbCache) {
            if (!dbCache.isStale) {
                logger_1.logger.info(`Layer 2 PostgreSQL cache hit for ${symbol}`);
                const result = dbCache.resultJson;
                // Pop back into memory cache
                memoryCache.set(memKey, result);
                return result;
            }
            else {
                logger_1.logger.info(`PostgreSQL cache found for ${symbol} but is flagged as stale`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to read database cache for ${symbol}`, { error });
    }
    return null;
}
/**
 * Saves analysis results to both in-memory cache and PostgreSQL database.
 */
async function setCachedAnalysis(symbol, resultJson, technicalScore, candleDate) {
    const memKey = `ta:${symbol}`;
    // Update Memory Cache
    memoryCache.set(memKey, resultJson);
    // Update Database Cache
    const normalizedDate = new Date(candleDate.toISOString().split('T')[0]);
    try {
        await prisma_1.default.technicalAnalysisCache.upsert({
            where: { symbol },
            update: {
                resultJson: resultJson,
                technicalScore: Number((0, mathUtils_1.round)(technicalScore, 2)),
                candleDate: normalizedDate,
                calculatedAt: new Date(),
                isStale: false
            },
            create: {
                symbol,
                resultJson: resultJson,
                technicalScore: Number((0, mathUtils_1.round)(technicalScore, 2)),
                candleDate: normalizedDate,
                isStale: false
            }
        });
        logger_1.logger.info(`Updated database cache for ${symbol}`);
    }
    catch (error) {
        logger_1.logger.error(`Failed to write database cache for ${symbol}`, { error });
    }
}
/**
 * Invalidates all cache. Called after new daily data is ingested.
 */
async function invalidateCache() {
    // Clear memory cache
    memoryCache.flushAll();
    logger_1.logger.info('Flushed in-memory analysis cache');
    try {
        // Set isStale = true in PostgreSQL
        await prisma_1.default.technicalAnalysisCache.updateMany({
            data: {
                isStale: true
            }
        });
        logger_1.logger.info('Marked all database cache rows as stale');
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate database cache', { error });
    }
}
