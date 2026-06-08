"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const llm_service_1 = require("../../services/llm.service");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../utils/logger");
class RiskScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('RiskScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const companyName = $('#top h1').first().text().trim() || ticker.toUpperCase();
            const description = $('.about .commentary').text().trim() ||
                $('.about').text().trim() ||
                '';
            // Extract Cons list from Screener
            const cons = [];
            $('.cons li, .cons ul li').each((_, el) => {
                const text = $(el).text().trim();
                if (text)
                    cons.push(text);
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

        Cons (Weaknesses/Risks):
        ${cons.join('\n')}

        Recent Corporate Announcements:
        ${devText}
      `.trim();
            logger_1.logger.info(`[RiskScraper] Extracting risks for ${ticker} via LLM`);
            const risks = await llm_service_1.LLMService.extractRisks(companyName, combinedText);
            const validatedRisks = risks.map((r) => stock_validators_1.CompanyRiskValidator.parse({
                riskType: r.riskType,
                description: r.description,
                severity: r.severity || 'Medium',
            }));
            // Save to database
            await stockData_repository_1.StockDataRepository.replaceCompanyRisks(companyId, validatedRisks);
            logger_1.logger.info(`[RiskScraper] Saved ${validatedRisks.length} risks for ${ticker}`);
            return validatedRisks;
        });
    }
}
exports.RiskScraper = RiskScraper;
