"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCandlesForSymbol = fetchCandlesForSymbol;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
const yahooFinance = new yahoo_finance2_1.default();
const candleValidator_1 = require("./candleValidator");
const logger_1 = require("../../utils/logger");
const dateUtils_1 = require("../../utils/dateUtils");
/**
 * Fetches OHLCV candle data for a given symbol.
 * @param symbol The NIFTY 50 symbol (e.g. RELIANCE.NS)
 * @param isNew If true, fetches 400 trading days of historical data.
 *              If false, fetches only the latest candles (~5 calendar days).
 */
async function fetchCandlesForSymbol(symbol, isNew) {
    const today = (0, dateUtils_1.getKolkataDate)();
    // Define period1 (start date)
    let period1;
    if (isNew) {
        // 400 trading days is roughly 580 calendar days
        period1 = new Date(today.getTime() - 580 * 24 * 60 * 60 * 1000);
    }
    else {
        // Last 5 days to ensure we capture the most recent trading days, including over weekends
        period1 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
    }
    logger_1.logger.info(`Fetching candles for ${symbol}`, {
        symbol,
        isNew,
        startDate: period1.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
    });
    try {
        const queryResult = await yahooFinance.historical(symbol, {
            period1: period1.toISOString().split('T')[0],
            period2: today.toISOString().split('T')[0],
            interval: '1d'
        });
        if (!queryResult || queryResult.length === 0) {
            logger_1.logger.warn(`No candles returned for ${symbol}`, { symbol });
            return [];
        }
        const validatedCandles = [];
        for (const row of queryResult) {
            const rawCandle = {
                symbol,
                date: new Date(row.date),
                open: row.open,
                high: row.high,
                low: row.low,
                close: row.close,
                volume: row.volume || 0
            };
            const valResult = (0, candleValidator_1.validateCandle)(rawCandle);
            // Store if validation is successful (qualityScore >= 60)
            if (valResult.valid) {
                validatedCandles.push({
                    symbol: rawCandle.symbol,
                    date: rawCandle.date,
                    open: rawCandle.open,
                    high: rawCandle.high,
                    low: rawCandle.low,
                    close: rawCandle.close,
                    volume: BigInt(Math.round(rawCandle.volume)),
                    dataQuality: valResult.qualityScore
                });
            }
            else {
                logger_1.logger.warn(`Skipping candle for ${symbol} on ${rawCandle.date.toISOString().split('T')[0]} due to low quality score (${valResult.qualityScore})`, {
                    symbol,
                    date: rawCandle.date,
                    reason: valResult.reason
                });
            }
        }
        logger_1.logger.info(`Successfully fetched and validated ${validatedCandles.length} candles for ${symbol}`, {
            symbol,
            count: validatedCandles.length
        });
        return validatedCandles;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error(`Failed to fetch candles for ${symbol}: ${errorMessage}`, { symbol, error });
        throw error;
    }
}
