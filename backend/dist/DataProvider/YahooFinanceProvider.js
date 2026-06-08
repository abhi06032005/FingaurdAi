"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YahooFinanceProvider = void 0;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
const yahooFinance = new yahoo_finance2_1.default();
class YahooFinanceProvider {
    constructor() { }
    async initialize() {
        // Yahoo Finance 2 doesn't need explicit cookie initialization like the NSE API
    }
    async getQuote(symbol) {
        // Automatically append .NS for Indian National Stock Exchange if not provided
        const querySymbol = symbol.includes('.') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
        try {
            // Fetch both real-time quote and deep fundamental/financial data
            const [quote, quoteSummary] = await Promise.all([
                yahooFinance.quote(querySymbol),
                yahooFinance.quoteSummary(querySymbol, {
                    modules: [
                        'financialData',
                        'assetProfile',
                        'defaultKeyStatistics',
                        'incomeStatementHistory',
                        'balanceSheetHistory',
                        'cashflowStatementHistory'
                    ]
                })
            ]);
            return {
                quote,
                fundamentals: quoteSummary
            };
        }
        catch (error) {
            console.error(`Yahoo Finance error for ${querySymbol}:`, error);
            throw error;
        }
    }
}
exports.YahooFinanceProvider = YahooFinanceProvider;
