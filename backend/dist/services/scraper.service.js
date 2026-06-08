"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const CompanyScraper_1 = require("../scrapers/companies/CompanyScraper");
const FinancialScraper_1 = require("../scrapers/financials/FinancialScraper");
const OwnershipScraper_1 = require("../scrapers/shareholding/OwnershipScraper");
const AnnouncementScraper_1 = require("../scrapers/announcements/AnnouncementScraper");
const BusinessIntelligenceScraper_1 = require("../scrapers/business/BusinessIntelligenceScraper");
const OrderBookScraper_1 = require("../scrapers/business/OrderBookScraper");
const ManagementCommentaryScraper_1 = require("../scrapers/management/ManagementCommentaryScraper");
const GrowthDriverScraper_1 = require("../scrapers/business/GrowthDriverScraper");
const RiskScraper_1 = require("../scrapers/business/RiskScraper");
const context_service_1 = require("./context.service");
const screener_helper_1 = require("../utils/screener.helper");
const logger_1 = require("../utils/logger");
class ScraperService {
    static isBulkScraping = false;
    static bulkProgress = {
        total: 0,
        current: 0,
        ticker: '',
        completed: [],
        failed: [],
    };
    /**
     * Retrieves the current bulk scraping progress.
     */
    static getBulkStatus() {
        return {
            isBulkScraping: this.isBulkScraping,
            progress: this.bulkProgress,
        };
    }
    /**
     * Aborts the active bulk scraping run.
     */
    static stopBulkScrape() {
        if (this.isBulkScraping) {
            this.isBulkScraping = false;
            logger_1.logger.info('[ScraperService] Bulk scrape execution abort requested by user.');
        }
    }
    /**
     * Starts a background bulk scraping process for a list of tickers.
     * Returns immediately.
     */
    static startBulkScrape(tickers) {
        if (this.isBulkScraping) {
            logger_1.logger.warn('[ScraperService] Bulk scrape requested, but one is already in progress.');
            return;
        }
        this.isBulkScraping = true;
        this.bulkProgress = {
            total: tickers.length,
            current: 0,
            ticker: '',
            completed: [],
            failed: [],
        };
        logger_1.logger.info(`[ScraperService] Initiating bulk background scrape for ${tickers.length} companies.`);
        // Run in background asynchronously (IIFE)
        (async () => {
            try {
                for (const ticker of tickers) {
                    // If stopped/aborted, exit the loop
                    if (!this.isBulkScraping) {
                        logger_1.logger.info('[ScraperService] Bulk scrape loop aborted.');
                        break;
                    }
                    this.bulkProgress.ticker = ticker;
                    logger_1.logger.info(`[ScraperService] [Bulk] Processing (${this.bulkProgress.current + 1}/${this.bulkProgress.total}) - ${ticker}`);
                    try {
                        await this.scrapeCompany(ticker);
                        this.bulkProgress.completed.push(ticker);
                    }
                    catch (error) {
                        logger_1.logger.error(`[ScraperService] [Bulk] Scrape failed for ${ticker}: ${error.message}`);
                        this.bulkProgress.failed.push(ticker);
                    }
                    this.bulkProgress.current++;
                }
            }
            catch (err) {
                logger_1.logger.error(`[ScraperService] [Bulk] Critical error in loop: ${err.message}`);
            }
            finally {
                this.isBulkScraping = false;
                logger_1.logger.info('[ScraperService] [Bulk] Background ingestion job completed.');
            }
        })();
    }
    /**
     * Run all 9 scrapers for a given stock symbol and regenerate its research context.
     */
    static async scrapeCompany(ticker) {
        const symbol = ticker.toUpperCase();
        logger_1.logger.info(`[ScraperService] Starting full scrape ingestion for ticker: ${symbol}`);
        // Clear Screener Helper cache to ensure fresh pages are fetched
        screener_helper_1.ScreenerHelper.clearCache();
        // 1. Run Company Scraper first to ensure the core Company record exists in the DB
        const companyScraper = new CompanyScraper_1.CompanyScraper();
        const company = await companyScraper.scrape(symbol);
        if (!company) {
            throw new Error(`Failed to scrape/upsert core company metadata for ${symbol}`);
        }
        const companyId = company.id;
        // 2. Run primary quantitative and raw timeline scrapers first.
        // Qualitative scrapers (like OrderBook and GrowthDrivers) check corporate developments in the DB,
        // so we scrape Announcements first.
        const announcementScraper = new AnnouncementScraper_1.AnnouncementScraper();
        const financialScraper = new FinancialScraper_1.FinancialScraper();
        const ownershipScraper = new OwnershipScraper_1.OwnershipScraper();
        logger_1.logger.info(`[ScraperService] Running primary scrapers (financials, ownership, announcements) for ${symbol}`);
        await Promise.all([
            announcementScraper.scrape(symbol, companyId),
            financialScraper.scrape(symbol, companyId),
            ownershipScraper.scrape(symbol, companyId),
        ]);
        // 3. Run qualitative/AI extractions using the combined DB and description context
        const biScraper = new BusinessIntelligenceScraper_1.BusinessIntelligenceScraper();
        const orderBookScraper = new OrderBookScraper_1.OrderBookScraper();
        const managementScraper = new ManagementCommentaryScraper_1.ManagementCommentaryScraper();
        const growthDriverScraper = new GrowthDriverScraper_1.GrowthDriverScraper();
        const riskScraper = new RiskScraper_1.RiskScraper();
        logger_1.logger.info(`[ScraperService] Running qualitative/AI scrapers for ${symbol}`);
        await Promise.all([
            biScraper.scrape(symbol, companyId),
            orderBookScraper.scrape(symbol, companyId),
            managementScraper.scrape(symbol, companyId),
            growthDriverScraper.scrape(symbol, companyId),
            riskScraper.scrape(symbol, companyId),
        ]);
        // 4. Regenerate pre-computed Research Context JSON
        logger_1.logger.info(`[ScraperService] Regenerating pre-computed Research Context for ${symbol}`);
        const context = await context_service_1.ResearchContextService.generateResearchContext(companyId);
        logger_1.logger.info(`[ScraperService] Completed full ingestion and regeneration for ${symbol}`);
        return { company, context };
    }
}
exports.ScraperService = ScraperService;
