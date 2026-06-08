"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const logger_1 = require("../../utils/logger");
class OwnershipScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('OwnershipScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            const section = $('#shareholding');
            if (!section.length) {
                throw new Error(`Shareholding section missing for ${ticker}`);
            }
            const table = section.find('table').first();
            if (!table.length) {
                throw new Error(`Shareholding table missing for ${ticker}`);
            }
            // Extract quarter labels from columns
            const quarters = [];
            table.find('thead tr th').each((i, el) => {
                const text = $(el).text().trim();
                // Matches "Jun 2023", "Sep 2024", etc.
                if (/^[A-Z][a-z]{2}\s+20\d{2}$/.test(text)) {
                    quarters.push(text);
                }
            });
            if (quarters.length === 0) {
                throw new Error(`No shareholding quarters found for ${ticker}`);
            }
            // Helper to extract row values
            const extractRowValues = (rowLabelRegexp) => {
                const values = quarters.map(() => null);
                table.find('tbody tr').each((_, row) => {
                    const cells = $(row).find('td');
                    const firstCellText = cells.first().text().trim();
                    if (!rowLabelRegexp.test(firstCellText))
                        return;
                    cells.each((colIdx, cell) => {
                        if (colIdx === 0)
                            return;
                        const quarterIdx = colIdx - 1;
                        if (quarterIdx >= quarters.length)
                            return;
                        const cellText = $(cell)
                            .clone()
                            .find('span, sup, sub')
                            .remove()
                            .end()
                            .text()
                            .trim();
                        const num = parseFloat(cellText.replace(/[^\d.-]/g, ''));
                        values[quarterIdx] = isNaN(num) ? null : num;
                    });
                });
                return values;
            };
            const promoterVals = extractRowValues(/^Promoters?/i);
            const fiiVals = extractRowValues(/^FII|FPI/i);
            const diiVals = extractRowValues(/^DII/i);
            const publicVals = extractRowValues(/^Public/i);
            const othersVals = extractRowValues(/^Others?/i);
            const pledgedVals = extractRowValues(/pledged/i); // Search for pledged row if present, else empty/null
            const ownershipHistory = [];
            // Store last 20 quarters (or all available)
            const startIndex = Math.max(0, quarters.length - 20);
            for (let i = startIndex; i < quarters.length; i++) {
                const pObj = {
                    quarter: quarters[i],
                    promoter: promoterVals[i] ?? null,
                    promoterPledged: pledgedVals[i] ?? 0, // default 0 if not found
                    fii: fiiVals[i] ?? null,
                    dii: diiVals[i] ?? null,
                    publicHolding: publicVals[i] ?? null,
                    others: othersVals[i] ?? null,
                };
                ownershipHistory.push(stock_validators_1.OwnershipHistoryValidator.parse(pObj));
            }
            await stockData_repository_1.StockDataRepository.replaceOwnershipHistory(companyId, ownershipHistory);
            logger_1.logger.info(`[OwnershipScraper] Successfully saved shareholding pattern for ${ticker}`);
            return ownershipHistory;
        });
    }
}
exports.OwnershipScraper = OwnershipScraper;
