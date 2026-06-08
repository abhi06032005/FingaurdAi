"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const llm_service_1 = require("../../services/llm.service");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../utils/logger");
class OrderBookScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('OrderBookScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const companyName = $('#top h1').first().text().trim() || ticker.toUpperCase();
            const description = $('.about .commentary').text().trim() ||
                $('.about').text().trim() ||
                '';
            // Fetch recent corporate developments for this company from DB to enrich context
            const developments = await prisma_1.prisma.corporateDevelopment.findMany({
                where: { companyId },
                take: 10,
                orderBy: { announcementDate: 'desc' },
            });
            const devText = developments.map((d) => `[${d.announcementDate.toISOString().split('T')[0]}] ${d.title}: ${d.summary}`).join('\n');
            const combinedText = `
        Description:
        ${description}
        
        Recent Corporate Announcements:
        ${devText}
      `.trim();
            const currentYear = new Date().getFullYear();
            logger_1.logger.info(`[OrderBookScraper] Extracting order book details for ${ticker} via LLM`);
            const orderBook = await llm_service_1.LLMService.extractOrderBook(companyName, combinedText, currentYear);
            // Only save if the LLM returned something meaningful (e.g. orderBookValue or orderInflows is not null)
            if (orderBook.orderBookValue != null || orderBook.orderInflows != null || orderBook.bookToBillRatio != null) {
                const validated = stock_validators_1.OrderBookDataValidator.parse(orderBook);
                await stockData_repository_1.StockDataRepository.replaceOrderBookData(companyId, [validated]);
                logger_1.logger.info(`[OrderBookScraper] Saved order book data for ${ticker}`);
                return [validated];
            }
            else {
                logger_1.logger.info(`[OrderBookScraper] No relevant order book data found for ${ticker}`);
                await stockData_repository_1.StockDataRepository.replaceOrderBookData(companyId, []); // empty list
                return [];
            }
        });
    }
}
exports.OrderBookScraper = OrderBookScraper;
