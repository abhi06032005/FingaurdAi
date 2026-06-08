"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const base_scraper_1 = require("../base.scraper");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const logger_1 = require("../../utils/logger");
const NSE_BASE = 'https://www.nseindia.com';
const TIMEOUT_MS = 10000;
function makeNseClient() {
    const jar = new tough_cookie_1.CookieJar();
    return (0, axios_cookiejar_support_1.wrapper)(axios_1.default.create({
        jar,
        timeout: TIMEOUT_MS,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
        },
        withCredentials: true,
    }));
}
class AnnouncementScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('AnnouncementScraper');
    }
    classifyAnnouncement(subject, desc) {
        const combined = `${subject} ${desc}`.toLowerCase();
        if (combined.includes('order') || combined.includes('contract') || combined.includes('win'))
            return 'Order Win';
        if (combined.includes('acquire') || combined.includes('acquisition') || combined.includes('merger') || combined.includes('amalgamation'))
            return 'Acquisition';
        if (combined.includes('partner') || combined.includes('mou') || combined.includes('tie-up') || combined.includes('collaboration'))
            return 'Partnership';
        if (combined.includes('capex') || combined.includes('capital expenditure'))
            return 'Capex';
        if (combined.includes('expansion') || combined.includes('commissioning') || combined.includes('new plant'))
            return 'Expansion';
        if (combined.includes('appoint') || combined.includes('resign') || combined.includes('chief financial') || combined.includes('ceo') || combined.includes('cfo') || combined.includes('managing director') || combined.includes('change in management'))
            return 'Management Change';
        if (combined.includes('dividend') || combined.includes('interim div') || combined.includes('final div'))
            return 'Dividend';
        if (combined.includes('split') || combined.includes('sub-division') || combined.includes('face value'))
            return 'Split';
        if (combined.includes('bonus'))
            return 'Bonus';
        if (combined.includes('buyback') || combined.includes('buy-back'))
            return 'Buyback';
        if (combined.includes('fund raise') || combined.includes('raise fund') || combined.includes('qip') || combined.includes('issuance') || combined.includes('allotment of shares'))
            return 'Fund Raise';
        if (combined.includes('result') || combined.includes('financial') || combined.includes('earnings') || combined.includes('audited'))
            return 'Results';
        if (combined.includes('meeting') || combined.includes('board meet'))
            return 'Board Meeting';
        return 'Board Meeting'; // default category
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const client = makeNseClient();
            const symbol = ticker.toUpperCase();
            // Step 1: Warm up cookie session
            logger_1.logger.info(`[AnnouncementScraper] Warming up NSE session for ${symbol}`);
            await client.get(`${NSE_BASE}/`, {
                headers: { Accept: 'text/html' },
            });
            // Mimic human timing
            await new Promise((r) => setTimeout(r, 800));
            // Step 2: Fetch announcements
            logger_1.logger.info(`[AnnouncementScraper] Fetching announcements for ${symbol}`);
            const response = await client.get(`${NSE_BASE}/api/corp-announcements`, {
                params: { index: 'equities', symbol },
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    Referer: `${NSE_BASE}/companies-listing/corporate-filings-announcements`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const rawAnnouncements = response.data;
            if (!Array.isArray(rawAnnouncements) || rawAnnouncements.length === 0) {
                logger_1.logger.info(`[AnnouncementScraper] No announcements found for ${symbol}`);
                return [];
            }
            const parsedDevelopments = [];
            for (const item of rawAnnouncements.slice(0, 20)) {
                const headline = item.subject || item.sm_name || item.bsedesc || item.desc || 'General announcement';
                const dateStr = item.an_dt || item.sort_date;
                if (!dateStr)
                    continue;
                // Parse date properly (NSE usually sends e.g. "31-May-2026 15:30:00" or ISO format)
                const dateVal = new Date(dateStr);
                if (isNaN(dateVal.getTime()))
                    continue;
                const category = this.classifyAnnouncement(headline, item.desc || '');
                const docUrl = item.attchmntFile ? `${NSE_BASE}${item.attchmntFile}` : null;
                const devObj = {
                    title: headline,
                    category,
                    summary: item.desc || headline,
                    announcementDate: dateVal,
                    sourceUrl: docUrl,
                };
                // Validate
                parsedDevelopments.push(stock_validators_1.CorporateDevelopmentValidator.parse(devObj));
            }
            // Save incrementally to database
            const inserted = await stockData_repository_1.StockDataRepository.insertCorporateDevelopmentsIncremental(companyId, parsedDevelopments);
            logger_1.logger.info(`[AnnouncementScraper] Processed ${parsedDevelopments.length} announcements, inserted ${inserted} new records for ${symbol}`);
            return parsedDevelopments;
        });
    }
}
exports.AnnouncementScraper = AnnouncementScraper;
