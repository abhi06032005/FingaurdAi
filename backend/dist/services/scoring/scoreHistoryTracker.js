"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordScoreHistory = recordScoreHistory;
exports.getScoreHistory = getScoreHistory;
const prisma_1 = __importDefault(require("../../config/prisma"));
/**
 * Persists or updates the daily Technical Strength Score and Rating in the database.
 */
async function recordScoreHistory(symbol, date, score, rating, confluenceScore) {
    const normalizedDate = new Date(date.toISOString().split('T')[0]);
    try {
        await prisma_1.default.scoreHistory.upsert({
            where: {
                symbol_date: {
                    symbol,
                    date: normalizedDate,
                },
            },
            update: {
                technicalScore: score,
                technicalRating: rating,
                confluenceScore: confluenceScore,
                recordedAt: new Date(),
            },
            create: {
                symbol,
                date: normalizedDate,
                technicalScore: score,
                technicalRating: rating,
                confluenceScore: confluenceScore,
            },
        });
    }
    catch (error) {
        console.error(`[ScoreHistoryTracker] Failed to record score history for ${symbol}:`, error);
        throw error;
    }
}
/**
 * Fetches the score history for a symbol for the last N days.
 */
async function getScoreHistory(symbol, limit = 30) {
    try {
        const records = await prisma_1.default.scoreHistory.findMany({
            where: { symbol },
            orderBy: { date: 'desc' },
            take: limit,
        });
        return records.map((r) => ({
            date: r.date.toISOString().split('T')[0],
            score: Number(r.technicalScore),
            rating: r.technicalRating,
        })).reverse();
    }
    catch (error) {
        console.error(`[ScoreHistoryTracker] Failed to retrieve score history for ${symbol}:`, error);
        return [];
    }
}
