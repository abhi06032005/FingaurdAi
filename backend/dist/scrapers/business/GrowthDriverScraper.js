"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthDriverScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const llm_service_1 = require("../../services/llm.service");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../utils/logger");
class GrowthDriverScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('GrowthDriverScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const companyName = $('#top h1').first().text().trim() || ticker.toUpperCase();
            const description = $('.about .commentary').text().trim() ||
                $('.about').text().trim() ||
                '';
            // Extract Pros list from Screener
            const pros = [];
            $('.pros li, .pros ul li').each((_, el) => {
                const text = $(el).text().trim();
                if (text)
                    pros.push(text);
            });
            // Fetch corporate developments
            const developments = await prisma_1.prisma.corporateDevelopment.findMany({
                where: { companyId },
                take: 10,
                orderBy: { announcementDate: 'desc' },
            });
            const devText = developments
                .map((d) => `[${d.announcementDate.toISOString().split('T')[0]}] ${d.title}: ${d.summary}`)
                .join('\n');
            const combinedText = `
        Description:
        ${description}

        Pros (Strengths):
        ${pros.join('\n')}

        Recent Corporate Announcements:
        ${devText}
      `.trim();
            logger_1.logger.info(`[GrowthDriverScraper] Extracting growth drivers for ${ticker} via LLM`);
            const drivers = await llm_service_1.LLMService.extractGrowthDrivers(companyName, combinedText);
            const validatedDrivers = drivers.map((d) => stock_validators_1.GrowthDriverValidator.parse({
                driverType: d.driverType,
                description: d.description,
                importanceScore: d.importanceScore || 5,
                source: d.source || 'Screener/Announcements',
            }));
            // Save to database
            await stockData_repository_1.StockDataRepository.replaceGrowthDrivers(companyId, validatedDrivers);
            logger_1.logger.info(`[GrowthDriverScraper] Saved ${validatedDrivers.length} growth drivers for ${ticker}`);
            return validatedDrivers;
        });
    }
}
exports.GrowthDriverScraper = GrowthDriverScraper;
