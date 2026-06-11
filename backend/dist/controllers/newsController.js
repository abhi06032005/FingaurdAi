"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewsByCategory = getNewsByCategory;
const newsService_1 = require("../services/newsService");
/**
 * Controller to fetch news by category from MongoDB
 */
async function getNewsByCategory(req, res, category) {
    try {
        const data = await (0, newsService_1.getNewsFromDb)(category);
        return res.status(200).json({
            success: true,
            category: category,
            count: data.length,
            data: data
        });
    }
    catch (err) {
        console.error(`[NewsController] Error fetching news for category "${category}":`, err.message);
        return res.status(500).json({
            success: false,
            error: `Failed to retrieve news articles for category "${category}"`
        });
    }
}
