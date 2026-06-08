"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const company_repository_1 = require("../../repositories/company.repository");
const stock_validators_1 = require("../../validators/stock.validators");
class CompanyScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('CompanyScraper');
    }
    async scrape(ticker, companyId = '') {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const html = $.html();
            // 1. Extract Company Name
            const companyName = $('#top h1').first().text().trim() || ticker.toUpperCase();
            // 2. Extract Description (About Section)
            const description = $('.about .commentary').text().trim() ||
                $('.about').text().trim() ||
                $('#top p.sub').text().trim() ||
                null;
            // 3. Extract Website
            let website = null;
            $('#top-ratios li').each((_, el) => {
                const text = $(el).text().toLowerCase();
                if (text.includes('website')) {
                    website = $(el).find('a').attr('href') || null;
                }
            });
            // 4. Extract Sector and Industry
            let sector = null;
            let industry = null;
            const subText = $('.peers p.sub').text() || '';
            const sectorMatch = subText.match(/Sector:\s*([^|]+)/i);
            const industryMatch = subText.match(/Industry:\s*([^|]+)/i);
            if (sectorMatch)
                sector = sectorMatch[1].trim();
            if (industryMatch)
                industry = industryMatch[1].trim();
            // 5. Extract Market Cap (convert to number in crores)
            let marketCap = null;
            $('#top-ratios li').each((_, el) => {
                const text = $(el).text().toLowerCase();
                if (text.includes('market cap')) {
                    const valText = $(el).find('.number').text().trim().replace(/,/g, '');
                    const val = parseFloat(valText);
                    if (!isNaN(val))
                        marketCap = val;
                }
            });
            // 6. Find ISIN (INE...) from raw HTML text
            const isinMatch = html.match(/INE\d{3}[A-Z0-9]{7}/i);
            const isin = isinMatch ? isinMatch[0].toUpperCase() : null;
            // Headquarters and employees are optional qualitative fields
            const parsedData = {
                ticker: ticker.toUpperCase(),
                companyName,
                isin,
                sector,
                industry,
                marketCap,
                website,
                description,
                headquarters: null,
                employees: null,
                listingDate: null,
            };
            // Validate data
            const validated = stock_validators_1.CompanyValidator.parse(parsedData);
            // Save to database
            const company = await company_repository_1.CompanyRepository.upsertCompany(ticker, {
                companyName: validated.companyName,
                isin: validated.isin,
                sector: validated.sector,
                industry: validated.industry,
                marketCap: validated.marketCap,
                website: validated.website,
                description: validated.description,
                headquarters: validated.headquarters,
                employees: validated.employees,
                listingDate: validated.listingDate,
            });
            return company;
        });
    }
}
exports.CompanyScraper = CompanyScraper;
