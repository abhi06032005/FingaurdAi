"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementCommentaryScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const llm_service_1 = require("../../services/llm.service");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../utils/logger");
class ManagementCommentaryScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('ManagementCommentaryScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const companyName = $('#top h1').first().text().trim() || ticker.toUpperCase();
            // Extract recent documents list from Screener.in
            const docTitles = [];
            $('.documents a, #documents a, .news a').each((_, el) => {
                const text = $(el).text().trim().replace(/\s+/g, ' ');
                if (text && !docTitles.includes(text)) {
                    docTitles.push(text);
                }
            });
            // Fetch recent corporate developments for results/guidance hints
            const developments = await prisma_1.prisma.corporateDevelopment.findMany({
                where: { companyId },
                take: 10,
                orderBy: { announcementDate: 'desc' },
            });
            const devText = developments
                .map((d) => `[${d.announcementDate.toISOString().split('T')[0]}] ${d.title}: ${d.summary}`)
                .join('\n');
            const combinedText = `
        Recent Published Documents:
        ${docTitles.join('\n')}

        Recent Corporate Announcements:
        ${devText}
      `.trim();
            const currentPeriod = `FY${new Date().getFullYear() % 100}`;
            logger_1.logger.info(`[ManagementCommentaryScraper] Generating commentary summary for ${ticker} via LLM`);
            const commentaries = await llm_service_1.LLMService.extractManagementCommentary(companyName, combinedText, currentPeriod);
            const validatedCommentaries = commentaries.map((comm) => stock_validators_1.ManagementCommentaryValidator.parse(comm));
            // Save to database
            await stockData_repository_1.StockDataRepository.replaceManagementCommentary(companyId, validatedCommentaries);
            logger_1.logger.info(`[ManagementCommentaryScraper] Saved ${validatedCommentaries.length} management commentaries for ${ticker}`);
            return validatedCommentaries;
        });
    }
}
exports.ManagementCommentaryScraper = ManagementCommentaryScraper;
