"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenerHelper = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const cheerio = __importStar(require("cheerio"));
const logger_1 = require("./logger");
const jar = new tough_cookie_1.CookieJar();
const client = (0, axios_cookiejar_support_1.wrapper)(axios_1.default.create({
    jar,
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    },
    withCredentials: true,
}));
class ScreenerHelper {
    static htmlCache = new Map();
    /**
     * Clears the in-memory HTML cache.
     */
    static clearCache() {
        this.htmlCache.clear();
    }
    /**
     * Fetches the Screener HTML page for a stock symbol and caches it.
     */
    static async getHtml(symbol) {
        const ticker = symbol.replace(/\.(NS|BO)$/i, '').toUpperCase();
        if (this.htmlCache.has(ticker)) {
            return this.htmlCache.get(ticker);
        }
        const urls = [
            `https://www.screener.in/company/${ticker}/consolidated/`,
            `https://www.screener.in/company/${ticker}/`,
        ];
        for (const url of urls) {
            try {
                logger_1.logger.info(`[ScreenerHelper] Fetching ${url}`);
                const response = await client.get(url);
                if (response.data && response.data.includes('id="top"')) {
                    this.htmlCache.set(ticker, response.data);
                    return response.data;
                }
            }
            catch (error) {
                logger_1.logger.warn(`[ScreenerHelper] Failed fetching ${url}: ${error.message}`);
            }
        }
        throw new Error(`Failed to fetch Screener page for ${ticker} from all fallback URLs`);
    }
    /**
     * Returns a loaded Cheerio instance for the symbol.
     */
    static async getCheerio(symbol) {
        const html = await this.getHtml(symbol);
        return cheerio.load(html);
    }
    /**
     * Generic Screener Table Parser.
     * Extracts columns (dates/years) and maps row labels to values.
     */
    static parseTable($, selector) {
        const section = $(selector);
        if (!section.length)
            return null;
        const table = section.find('table').first();
        if (!table.length)
            return null;
        const columns = [];
        table.find('thead tr th').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt && i > 0) {
                columns.push(txt);
            }
        });
        const rows = {};
        table.find('tbody tr').each((_, tr) => {
            const cells = $(tr).find('td');
            const rawLabel = cells.first().text().trim();
            const label = rawLabel.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
            if (!label)
                return;
            const values = [];
            cells.each((idx, td) => {
                if (idx === 0)
                    return;
                const clone = $(td).clone();
                clone.find('span, sup, sub').remove();
                const txt = clone.text().trim().replace(/,/g, '').replace(/%/g, '');
                const val = parseFloat(txt);
                values.push(isNaN(val) ? null : val);
            });
            rows[label] = values;
        });
        return { columns, rows };
    }
}
exports.ScreenerHelper = ScreenerHelper;
