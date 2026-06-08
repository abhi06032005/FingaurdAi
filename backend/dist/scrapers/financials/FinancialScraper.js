"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialScraper = void 0;
const base_scraper_1 = require("../base.scraper");
const screener_helper_1 = require("../../utils/screener.helper");
const stockData_repository_1 = require("../../repositories/stockData.repository");
const stock_validators_1 = require("../../validators/stock.validators");
const logger_1 = require("../../utils/logger");
class FinancialScraper extends base_scraper_1.BaseScraper {
    constructor() {
        super('FinancialScraper');
    }
    async scrape(ticker, companyId) {
        return this.executeWithRetry(ticker, async () => {
            const $ = await screener_helper_1.ScreenerHelper.getCheerio(ticker);
            // Parse Screener Tables
            const plTable = screener_helper_1.ScreenerHelper.parseTable($, '#profit-loss');
            const bsTable = screener_helper_1.ScreenerHelper.parseTable($, '#balance-sheet');
            const cfTable = screener_helper_1.ScreenerHelper.parseTable($, '#cash-flow');
            if (!plTable || !bsTable) {
                throw new Error(`Critical financial tables (Profit & Loss or Balance Sheet) missing for ${ticker}`);
            }
            const columns = plTable.columns; // e.g. ["Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024"]
            const years = columns.map((col) => parseInt(col.match(/\d{4}/)?.[0] || '0')).filter((y) => y > 0);
            // Align rows
            const plRows = plTable.rows;
            const bsRows = bsTable.rows;
            const cfRows = cfTable?.rows || {};
            // Match rows (case-insensitive keys from parseTable)
            const sales = plRows['sales'] || plRows['revenue'] || [];
            const ebitda = plRows['operating profit'] || [];
            const opm = plRows['opm'] || []; // margin in percent
            const netProfit = plRows['net profit'] || [];
            const eps = plRows['eps in rs'] || plRows['eps'] || [];
            const interest = plRows['interest'] || [];
            const pbt = plRows['profit before tax'] || [];
            const shareCapital = bsRows['share capital'] || [];
            const reserves = bsRows['reserves'] || [];
            const borrowings = bsRows['borrowings'] || []; // debt
            const totalAssets = bsRows['total assets'] || [];
            const ocf = cfRows['cash from operating activity'] || cfRows['operating cash flow'] || [];
            const capex = cfRows['fixed assets purchased'] || cfRows['capex'] || [];
            // Extract ratios cards
            const ratios = {};
            $('#top-ratios li').each((_, el) => {
                const name = $(el).find('.name').text().trim().toLowerCase().replace(/\s+/g, ' ');
                const valText = $(el).find('.number').text().trim().replace(/,/g, '').replace(/%/g, '');
                const val = parseFloat(valText);
                if (!isNaN(val)) {
                    ratios[name] = val;
                }
            });
            // Get latest book value and metrics from ratios card
            const latestBookValue = ratios['book value'] ?? null;
            const latestPeg = ratios['peg ratio'] ?? ratios['peg'] ?? null;
            const latestPe = ratios['stock p/e'] ?? ratios['stock pe'] ?? ratios['pe'] ?? null;
            const latestPb = ratios['price to book'] ?? ratios['pb'] ?? null;
            const latestMarketCap = ratios['market cap'] ?? null;
            const latestDividendYield = ratios['dividend yield'] ?? null;
            const latestEv = ratios['enterprise value'] ?? null;
            const latestEvEbitda = ratios['ev / ebitda'] ?? ratios['ev/ebitda'] ?? null;
            const financialsData = [];
            const qualityMetricsData = [];
            // Process last 5 available years (or all if less than 5)
            const startIndex = Math.max(0, columns.length - 5);
            for (let i = startIndex; i < columns.length; i++) {
                const year = years[i];
                if (!year)
                    continue;
                // Financial Growth Values
                const revVal = sales[i] ?? null;
                const ebitdaVal = ebitda[i] ?? null;
                const profitVal = netProfit[i] ?? null;
                const epsVal = eps[i] ?? null;
                const capVal = shareCapital[i] ?? 0;
                const resVal = reserves[i] ?? 0;
                const equityVal = capVal + resVal || null;
                const debtVal = borrowings[i] ?? null;
                const assetsVal = totalAssets[i] ?? null;
                const ocfVal = ocf[i] ?? null;
                const capexVal = capex[i] ?? null;
                const fcfVal = ocfVal != null ? ocfVal - Math.abs(capexVal || 0) : null;
                const cashVal = null;
                // Book value: equity or use latest card value as estimate for last year
                const bookValueVal = i === columns.length - 1 && latestBookValue ? latestBookValue : (equityVal ? equityVal : null);
                const finObj = {
                    year,
                    revenue: revVal,
                    ebitda: ebitdaVal,
                    netProfit: profitVal,
                    eps: epsVal,
                    bookValue: bookValueVal,
                    operatingCashFlow: ocfVal,
                    freeCashFlow: fcfVal,
                    assets: assetsVal,
                    equity: equityVal,
                    cash: cashVal,
                    debt: debtVal,
                };
                // Quality Metrics Calculations
                const roeVal = equityVal && profitVal ? (profitVal / equityVal) * 100 : null;
                const roceVal = (ebitdaVal != null) && equityVal && debtVal ? (ebitdaVal / (equityVal + debtVal)) * 100 : null;
                const roaVal = assetsVal && profitVal ? (profitVal / assetsVal) * 100 : null;
                const grossMarginVal = opm[i] ?? null;
                const operatingMarginVal = opm[i] ?? null;
                const ebitdaMarginVal = revVal && ebitdaVal ? (ebitdaVal / revVal) * 100 : null;
                const netMarginVal = revVal && profitVal ? (profitVal / revVal) * 100 : null;
                const assetTurnoverVal = revVal && assetsVal ? revVal / assetsVal : null;
                const interestVal = interest[i] != null ? Math.abs(interest[i]) : 0;
                const interestCoverageVal = interestVal > 0 && pbt[i] != null ? ((pbt[i] ?? 0) + interestVal) / interestVal : null;
                const cashConversionRatioVal = profitVal && ocfVal ? ocfVal / profitVal : null;
                const qmObj = {
                    year,
                    roe: roeVal,
                    roce: roceVal,
                    roa: roaVal,
                    grossMargin: grossMarginVal,
                    operatingMargin: operatingMarginVal,
                    ebitdaMargin: ebitdaMarginVal,
                    netMargin: netMarginVal,
                    assetTurnover: assetTurnoverVal,
                    interestCoverage: interestCoverageVal,
                    cashConversionRatio: cashConversionRatioVal,
                };
                // Validate
                financialsData.push(stock_validators_1.FinancialGrowthValidator.parse(finObj));
                qualityMetricsData.push(stock_validators_1.QualityMetricsValidator.parse(qmObj));
            }
            // Save Financial Growth & Quality Metrics
            await stockData_repository_1.StockDataRepository.replaceFinancialGrowth(companyId, financialsData);
            await stockData_repository_1.StockDataRepository.replaceQualityMetrics(companyId, qualityMetricsData);
            // Latest Sales value for calculating PS & EV/Sales
            const latestSales = sales.length > 0 ? sales[sales.length - 1] : null;
            const psVal = latestMarketCap && latestSales ? latestMarketCap / latestSales : null;
            const evSalesVal = latestEv && latestSales ? latestEv / latestSales : null;
            // Extract & Save Valuation Metrics
            const valuationObj = {
                pe: latestPe,
                forwardPe: latestPe, // estimated as current PE
                pb: latestPb,
                ps: psVal,
                peg: latestPeg,
                evEbitda: latestEvEbitda,
                evSales: evSalesVal,
                dividendYield: latestDividendYield,
                marketCap: latestMarketCap,
                enterpriseValue: latestEv,
            };
            const validatedValuation = stock_validators_1.ValuationMetricsValidator.parse(valuationObj);
            await stockData_repository_1.StockDataRepository.upsertValuationMetrics(companyId, validatedValuation);
            logger_1.logger.info(`[FinancialScraper] Successfully saved financial growth, quality, and valuation data for ${ticker}`);
            return { financialsData, qualityMetricsData, valuationData: validatedValuation };
        });
    }
}
exports.FinancialScraper = FinancialScraper;
