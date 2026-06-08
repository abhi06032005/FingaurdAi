"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const company_repository_1 = require("../repositories/company.repository");
const AnnouncementScraper_1 = require("../scrapers/announcements/AnnouncementScraper");
const FinancialScraper_1 = require("../scrapers/financials/FinancialScraper");
const OwnershipScraper_1 = require("../scrapers/shareholding/OwnershipScraper");
const BusinessIntelligenceScraper_1 = require("../scrapers/business/BusinessIntelligenceScraper");
const OrderBookScraper_1 = require("../scrapers/business/OrderBookScraper");
const ManagementCommentaryScraper_1 = require("../scrapers/management/ManagementCommentaryScraper");
const GrowthDriverScraper_1 = require("../scrapers/business/GrowthDriverScraper");
const RiskScraper_1 = require("../scrapers/business/RiskScraper");
const context_service_1 = require("../services/context.service");
const logger_1 = require("../utils/logger");
function initCronJobs() {
    logger_1.logger.info('[Cron] Initializing cron schedules...');
    /**
     * DAILY CRON: Corporate developments & announcements (at 6:30 PM after market closes)
     */
    node_cron_1.default.schedule('30 18 * * *', async () => {
        logger_1.logger.info('[Cron] Starting daily announcements scraping task');
        try {
            const companies = await company_repository_1.CompanyRepository.listAll();
            const announcementScraper = new AnnouncementScraper_1.AnnouncementScraper();
            for (const company of companies) {
                try {
                    await announcementScraper.scrape(company.ticker, company.id);
                }
                catch (err) {
                    logger_1.logger.error(`[Cron] Daily scrape failed for ${company.ticker}: ${err.message}`);
                }
            }
            logger_1.logger.info('[Cron] Daily announcements scraping task completed');
        }
        catch (err) {
            logger_1.logger.error(`[Cron] Daily task failed to retrieve companies: ${err.message}`);
        }
    });
    /**
     * WEEKLY CRON: Ownership (shareholding) and Valuation Metrics (on Sunday at midnight)
     */
    node_cron_1.default.schedule('0 0 * * 0', async () => {
        logger_1.logger.info('[Cron] Starting weekly ownership and valuation scraping task');
        try {
            const companies = await company_repository_1.CompanyRepository.listAll();
            const ownershipScraper = new OwnershipScraper_1.OwnershipScraper();
            const financialScraper = new FinancialScraper_1.FinancialScraper(); // valuation metrics and financials
            for (const company of companies) {
                try {
                    await ownershipScraper.scrape(company.ticker, company.id);
                    await financialScraper.scrape(company.ticker, company.id);
                }
                catch (err) {
                    logger_1.logger.error(`[Cron] Weekly scrape failed for ${company.ticker}: ${err.message}`);
                }
            }
            logger_1.logger.info('[Cron] Weekly scraping task completed');
        }
        catch (err) {
            logger_1.logger.error(`[Cron] Weekly task failed: ${err.message}`);
        }
    });
    /**
     * MONTHLY CRON: Pre-computed Research Context Regeneration (1st of every month at 1:00 AM)
     */
    node_cron_1.default.schedule('0 1 1 * *', async () => {
        logger_1.logger.info('[Cron] Starting monthly research context regeneration task');
        try {
            const companies = await company_repository_1.CompanyRepository.listAll();
            for (const company of companies) {
                try {
                    await context_service_1.ResearchContextService.generateResearchContext(company.id);
                }
                catch (err) {
                    logger_1.logger.error(`[Cron] Monthly regeneration failed for ${company.ticker}: ${err.message}`);
                }
            }
            logger_1.logger.info('[Cron] Monthly research context regeneration task completed');
        }
        catch (err) {
            logger_1.logger.error(`[Cron] Monthly task failed: ${err.message}`);
        }
    });
    /**
     * QUARTERLY CRON: Financial growth updates and Management commentary (1st of Jan, Apr, Jul, Oct at 2:00 AM)
     */
    node_cron_1.default.schedule('0 2 1 */3 *', async () => {
        logger_1.logger.info('[Cron] Starting quarterly financial and management commentary scraping task');
        try {
            const companies = await company_repository_1.CompanyRepository.listAll();
            const financialScraper = new FinancialScraper_1.FinancialScraper();
            const managementScraper = new ManagementCommentaryScraper_1.ManagementCommentaryScraper();
            for (const company of companies) {
                try {
                    await financialScraper.scrape(company.ticker, company.id);
                    await managementScraper.scrape(company.ticker, company.id);
                }
                catch (err) {
                    logger_1.logger.error(`[Cron] Quarterly scrape failed for ${company.ticker}: ${err.message}`);
                }
            }
            logger_1.logger.info('[Cron] Quarterly scraping task completed');
        }
        catch (err) {
            logger_1.logger.error(`[Cron] Quarterly task failed: ${err.message}`);
        }
    });
    /**
     * ANNUAL CRON: Business updates, segments, order book, risks, and growth drivers (April 1st at 3:00 AM)
     */
    node_cron_1.default.schedule('0 3 1 4 *', async () => {
        logger_1.logger.info('[Cron] Starting annual business and operational scraping task');
        try {
            const companies = await company_repository_1.CompanyRepository.listAll();
            const biScraper = new BusinessIntelligenceScraper_1.BusinessIntelligenceScraper();
            const orderBookScraper = new OrderBookScraper_1.OrderBookScraper();
            const growthDriverScraper = new GrowthDriverScraper_1.GrowthDriverScraper();
            const riskScraper = new RiskScraper_1.RiskScraper();
            for (const company of companies) {
                try {
                    await biScraper.scrape(company.ticker, company.id);
                    await orderBookScraper.scrape(company.ticker, company.id);
                    await growthDriverScraper.scrape(company.ticker, company.id);
                    await riskScraper.scrape(company.ticker, company.id);
                }
                catch (err) {
                    logger_1.logger.error(`[Cron] Annual scrape failed for ${company.ticker}: ${err.message}`);
                }
            }
            logger_1.logger.info('[Cron] Annual scraping task completed');
        }
        catch (err) {
            logger_1.logger.error(`[Cron] Annual task failed: ${err.message}`);
        }
    });
    logger_1.logger.info('[Cron] Cron schedules successfully initialized!');
}
