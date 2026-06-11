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
exports.fetchAndSyncNews = fetchAndSyncNews;
exports.getNewsFromDb = getNewsFromDb;
exports.cleanupStaleNews = cleanupStaleNews;
const rss_parser_1 = __importDefault(require("rss-parser"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const p_limit_1 = __importDefault(require("p-limit"));
const News_1 = __importDefault(require("../models/News"));
const parser = new rss_parser_1.default({
    customFields: {
        item: ['source', 'description']
    }
});
// Categories mapping
const CATEGORIES = {
    'indian-market': 'https://news.google.com/rss/search?q=Indian+stock+market',
    'ipo': 'https://news.google.com/rss/search?q=IPO+India',
    'global': 'https://news.google.com/rss/search?q=Global+Stock+Market',
    'earnings': 'https://news.google.com/rss/search?q=India+Quarterly+Results'
};
/**
 * Strips the publication source suffix from the title if present
 */
function cleanArticleTitle(title, source) {
    let cleanTitle = title || '';
    if (source && cleanTitle.endsWith(` - ${source}`)) {
        cleanTitle = cleanTitle.substring(0, cleanTitle.length - ` - ${source}`.length);
    }
    else {
        const lastHyphenIndex = cleanTitle.lastIndexOf(' - ');
        if (lastHyphenIndex !== -1) {
            cleanTitle = cleanTitle.substring(0, lastHyphenIndex);
        }
    }
    return cleanTitle.trim();
}
/**
 * Fetches the Open Graph image from the target article page
 */
async function fetchArticleImage(link) {
    if (!link)
        return '';
    try {
        const res = await axios_1.default.get(link, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000 // 5 seconds timeout to keep sync fast
        });
        const $ = cheerio.load(res.data);
        const ogImage = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            '';
        if (ogImage && (ogImage.startsWith('http://') || ogImage.startsWith('https://'))) {
            return ogImage;
        }
        return '';
    }
    catch (err) {
        // Fail silently and let fallback handle it
        return '';
    }
}
/**
 * Fetches RSS feeds for all categories, parses, removes duplicates, and saves to MongoDB.
 * Ignores articles older than 48 hours.
 */
async function fetchAndSyncNews() {
    console.log('[NewsService] Starting news sync from Google News RSS feeds...');
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const limit = (0, p_limit_1.default)(5); // Fetch 5 article images concurrently
    for (const [category, url] of Object.entries(CATEGORIES)) {
        try {
            console.log(`[NewsService] Fetching feed for category "${category}" from: ${url}`);
            const feed = await parser.parseURL(url);
            let upsertCount = 0;
            let skipCount = 0;
            // Filter for valid items first
            const validItems = feed.items.filter((item) => {
                const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
                if (publishedAt < fortyEightHoursAgo) {
                    skipCount++;
                    return false;
                }
                return true;
            });
            console.log(`[NewsService] Category "${category}" has ${validItems.length} recent articles. Resolving image metadata concurrently...`);
            // Fetch images for all articles concurrently (throttled by p-limit)
            const resolvedArticles = await Promise.all(validItems.map((item) => limit(async () => {
                const imageUrl = await fetchArticleImage(item.link || '');
                return { item, imageUrl };
            })));
            for (const { item, imageUrl } of resolvedArticles) {
                const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
                const sourceName = item.source || 'Google News';
                const cleanTitle = cleanArticleTitle(item.title || '', sourceName);
                const description = item.contentSnippet || item.description || '';
                // Upsert to DB, matching unique 'link' field
                await News_1.default.findOneAndUpdate({ link: item.link }, {
                    title: cleanTitle,
                    description: description,
                    source: sourceName,
                    link: item.link,
                    image: imageUrl, // Extracted real-time image URL
                    category: category,
                    publishedAt: publishedAt,
                    createdAt: new Date()
                }, { upsert: true, returnDocument: 'after' } // Replaced deprecated 'new: true' with 'returnDocument'
                );
                upsertCount++;
            }
            console.log(`[NewsService] Category "${category}" synced successfully: ${upsertCount} upserted, ${skipCount} skipped (older than 48h).`);
        }
        catch (err) {
            console.error(`[NewsService] Failed to sync category "${category}":`, err.message);
        }
    }
    console.log('[NewsService] Finished news sync.');
}
/**
 * Retrieves latest 20 news articles for a category from MongoDB, sorted newest first
 */
async function getNewsFromDb(category) {
    return await News_1.default.find({ category })
        .sort({ publishedAt: -1 })
        .limit(20)
        .lean();
}
/**
 * Daily cleanup at midnight: Delete news older than 48 hours
 */
async function cleanupStaleNews() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    console.log(`[NewsService] Cleaning up stale news older than ${fortyEightHoursAgo.toISOString()}...`);
    try {
        const result = await News_1.default.deleteMany({ publishedAt: { $lt: fortyEightHoursAgo } });
        console.log(`[NewsService] Stale news cleanup complete. Deleted ${result.deletedCount} articles.`);
    }
    catch (err) {
        console.error('[NewsService] Failed to clean up stale news:', err.message);
    }
}
