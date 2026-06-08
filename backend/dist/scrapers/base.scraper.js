"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
const logger_1 = require("../utils/logger");
class BaseScraper {
    name;
    constructor(name) {
        this.name = name;
    }
    /**
     * Helper to execute a scraping action with automatic retries and exponential backoff.
     */
    async executeWithRetry(ticker, action, retries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logger_1.logger.info(`[${this.name}] Starting fetch for ${ticker} (Attempt ${attempt}/${retries})`);
                const data = await action();
                logger_1.logger.info(`[${this.name}] Successfully fetched data for ${ticker}`);
                return data;
            }
            catch (error) {
                logger_1.logger.warn(`[${this.name}] Attempt ${attempt} failed for ${ticker}. Error: ${error.message}`);
                if (attempt === retries) {
                    logger_1.logger.error(`[${this.name}] All ${retries} attempts failed for ${ticker}`);
                    return null;
                }
                // Exponential backoff delay
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        return null;
    }
}
exports.BaseScraper = BaseScraper;
