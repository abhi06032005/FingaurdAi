"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessIntelligenceScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const llm_service_1 = require("../../services/llm.service");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const logger_1 = require("../../utils/logger");
class BusinessIntelligenceScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('BusinessIntelligenceScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const companyName = $('#top h1').first().text().trim() || ticker.toUpperCase();
            const description = $('.about .commentary').text().trim() ||
                $('.about').text().trim() ||
                $('#top p.sub').text().trim() ||
                '';
            if (!description) {
                logger_1.logger.warn(`[BusinessIntelligenceScraper] Description is empty for ${ticker}`);
            }
            // 1. Extract and Save Business Intelligence fields via LLM
            logger_1.logger.info(`[BusinessIntelligenceScraper] Extracting structured BI for ${ticker} via LLM`);
            const biData = await llm_service_1.LLMService.extractBusinessIntelligence(companyName, description);
            // Validate
            const validatedBi = stock_validators_1.BusinessIntelligenceValidator.parse(biData);
            // Save
            await stockData_repository_1.StockDataRepository.upsertBusinessIntelligence(companyId, validatedBi);
            // 2. Extract and Save Business Segments list via LLM
            const currentYear = new Date().getFullYear();
            logger_1.logger.info(`[BusinessIntelligenceScraper] Extracting segments for ${ticker} via LLM`);
            const segments = await llm_service_1.LLMService.extractBusinessSegments(companyName, description, currentYear);
            const validatedSegments = segments.map(seg => stock_validators_1.BusinessSegmentValidator.parse(seg));
            // Save
            await stockData_repository_1.StockDataRepository.replaceBusinessSegments(companyId, validatedSegments);
            logger_1.logger.info(`[BusinessIntelligenceScraper] Successfully saved BI and segments for ${ticker}`);
            return { businessIntelligence: validatedBi, segments: validatedSegments };
        });
    }
}
exports.BusinessIntelligenceScraper = BusinessIntelligenceScraper;
