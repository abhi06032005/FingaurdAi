"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../config/prisma"));
const router = express_1.default.Router();
// --- 1. STATISTICS ENDPOINTS ---
// Fetch the cached community impact stats (singleton)
router.get("/statistics", async (req, res) => {
    try {
        let stats = await prisma_1.default.statistics.findUnique({
            where: { id: "singleton" }
        });
        // Seed initial metrics if database is empty
        if (!stats) {
            stats = await prisma_1.default.statistics.create({
                data: {
                    id: "singleton",
                    totalVictims: 142,
                    totalLosses: 3845000, // ₹38.45L
                    verifiedReports: 58
                }
            });
        }
        return res.status(200).json({ success: true, data: stats });
    }
    catch (error) {
        console.error("[Scams API] Failed to fetch statistics:", error);
        return res.status(500).json({ error: "Failed to fetch statistics", details: error.message });
    }
});
// Update the cached statistics (admin action)
router.put("/statistics", async (req, res) => {
    const { totalVictims, totalLosses, verifiedReports } = req.body;
    try {
        const stats = await prisma_1.default.statistics.upsert({
            where: { id: "singleton" },
            update: {
                totalVictims: parseInt(totalVictims),
                totalLosses: parseFloat(totalLosses),
                verifiedReports: parseInt(verifiedReports)
            },
            create: {
                id: "singleton",
                totalVictims: parseInt(totalVictims) || 0,
                totalLosses: parseFloat(totalLosses) || 0.0,
                verifiedReports: parseInt(verifiedReports) || 0
            }
        });
        return res.status(200).json({ success: true, data: stats });
    }
    catch (error) {
        console.error("[Scams API] Failed to update statistics:", error);
        return res.status(500).json({ error: "Failed to update statistics", details: error.message });
    }
});
// --- 2. REPORTS ENDPOINTS ---
// Submit a new scam report
router.post("/reports", async (req, res) => {
    const { scamType, lossRange, description, evidenceUrl, name, phone, email } = req.body;
    if (!scamType || !lossRange || !description || !name || !phone || !email) {
        return res.status(400).json({ error: "Missing required report fields" });
    }
    try {
        const report = await prisma_1.default.report.create({
            data: {
                scamType,
                lossRange,
                description,
                evidenceUrl: evidenceUrl || null,
                name,
                phone,
                email,
                status: "pending"
            }
        });
        return res.status(201).json({ success: true, data: report });
    }
    catch (error) {
        console.error("[Scams API] Failed to create report:", error);
        return res.status(500).json({ error: "Failed to submit report", details: error.message });
    }
});
// Fetch all reports (admin panel view)
router.get("/reports", async (req, res) => {
    try {
        const reports = await prisma_1.default.report.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json({ success: true, data: reports });
    }
    catch (error) {
        console.error("[Scams API] Failed to fetch reports:", error);
        return res.status(500).json({ error: "Failed to retrieve reports", details: error.message });
    }
});
// Update a report's status/details (admin verification action)
router.put("/reports/:id", async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: "Missing status field" });
    }
    try {
        const updatedReport = await prisma_1.default.report.update({
            where: { id },
            data: { status }
        });
        // If report is marked as verified, we can auto-increment statistics.verifiedReports
        if (status === "verified") {
            await prisma_1.default.statistics.upsert({
                where: { id: "singleton" },
                update: {
                    verifiedReports: { increment: 1 },
                    totalVictims: { increment: 1 }
                },
                create: {
                    id: "singleton",
                    verifiedReports: 1,
                    totalVictims: 1
                }
            });
        }
        return res.status(200).json({ success: true, data: updatedReport });
    }
    catch (error) {
        console.error("[Scams API] Failed to update report status:", error);
        return res.status(500).json({ error: "Failed to update report", details: error.message });
    }
});
// --- 3. STORIES ENDPOINTS ---
// Fetch published verified stories (public dashboard view)
router.get("/stories", async (req, res) => {
    const { all } = req.query;
    try {
        const stories = await prisma_1.default.story.findMany({
            where: all === "true" ? {} : { published: true },
            orderBy: { createdAt: "desc" }
        });
        const storiesWithReportDetails = await Promise.all(stories.map(async (story) => {
            const report = await prisma_1.default.report.findUnique({
                where: { id: story.reportId },
                select: { scamType: true, lossRange: true }
            });
            return {
                ...story,
                scamType: report?.scamType || "Unknown",
                lossRange: report?.lossRange || "Unknown"
            };
        }));
        return res.status(200).json({ success: true, data: storiesWithReportDetails });
    }
    catch (error) {
        console.error("[Scams API] Failed to fetch stories:", error);
        return res.status(500).json({ error: "Failed to retrieve stories", details: error.message });
    }
});
// Publish a new story (admin action converting a verified report)
router.post("/stories", async (req, res) => {
    const { reportId, title, summary, published } = req.body;
    if (!reportId || !title || !summary) {
        return res.status(400).json({ error: "Missing required story fields" });
    }
    try {
        const story = await prisma_1.default.story.create({
            data: {
                reportId,
                title,
                summary,
                published: published ?? false
            }
        });
        return res.status(201).json({ success: true, data: story });
    }
    catch (error) {
        console.error("[Scams API] Failed to create story:", error);
        return res.status(500).json({ error: "Failed to publish story", details: error.message });
    }
});
// Toggle published status or update a story
router.put("/stories/:id", async (req, res) => {
    const id = req.params.id;
    const { title, summary, published } = req.body;
    try {
        const updatedStory = await prisma_1.default.story.update({
            where: { id },
            data: {
                title: title || undefined,
                summary: summary || undefined,
                published: published !== undefined ? published : undefined
            }
        });
        return res.status(200).json({ success: true, data: updatedStory });
    }
    catch (error) {
        console.error("[Scams API] Failed to update story:", error);
        return res.status(500).json({ error: "Failed to update story", details: error.message });
    }
});
// --- 4. ALERTS ENDPOINTS ---
// Fetch the alerts feed (public)
router.get("/alerts", async (req, res) => {
    try {
        const alerts = await prisma_1.default.alert.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json({ success: true, data: alerts });
    }
    catch (error) {
        console.error("[Scams API] Failed to fetch alerts:", error);
        return res.status(500).json({ error: "Failed to retrieve alerts", details: error.message });
    }
});
// Create a new scam alert (admin action)
router.post("/alerts", async (req, res) => {
    const { title, description, riskLevel, status } = req.body;
    if (!title || !description || !riskLevel) {
        return res.status(400).json({ error: "Missing required alert fields" });
    }
    try {
        const alert = await prisma_1.default.alert.create({
            data: {
                title,
                description,
                riskLevel,
                status: status || "under_investigation"
            }
        });
        return res.status(201).json({ success: true, data: alert });
    }
    catch (error) {
        console.error("[Scams API] Failed to create alert:", error);
        return res.status(500).json({ error: "Failed to create alert", details: error.message });
    }
});
// Update an alert status/details
router.put("/alerts/:id", async (req, res) => {
    const id = req.params.id;
    const { title, description, riskLevel, status } = req.body;
    try {
        const updatedAlert = await prisma_1.default.alert.update({
            where: { id },
            data: {
                title: title || undefined,
                description: description || undefined,
                riskLevel: riskLevel || undefined,
                status: status || undefined
            }
        });
        return res.status(200).json({ success: true, data: updatedAlert });
    }
    catch (error) {
        console.error("[Scams API] Failed to update alert:", error);
        return res.status(500).json({ error: "Failed to update alert", details: error.message });
    }
});
// --- 5. COMMENTS/DISCUSSIONS ENDPOINTS ---
// Fetch all comments (sorted by date descending)
router.get("/comments", async (req, res) => {
    try {
        const comments = await prisma_1.default.comment.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json({ success: true, data: comments });
    }
    catch (error) {
        console.error("[Scams API] Failed to fetch comments:", error);
        return res.status(500).json({ error: "Failed to retrieve comments", details: error.message });
    }
});
// Create a new comment (Max 100 characters)
router.post("/comments", async (req, res) => {
    const { text, author } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Comment text is required" });
    }
    if (text.length > 100) {
        return res.status(400).json({ error: "Comment text cannot exceed 100 characters" });
    }
    try {
        const comment = await prisma_1.default.comment.create({
            data: {
                text,
                author: author && author.trim() !== "" ? author.trim() : "Anonymous"
            }
        });
        return res.status(201).json({ success: true, data: comment });
    }
    catch (error) {
        console.error("[Scams API] Failed to create comment:", error);
        return res.status(500).json({ error: "Failed to submit comment", details: error.message });
    }
});
// Upvote a comment
router.post("/comments/:id/upvote", async (req, res) => {
    const id = req.params.id;
    try {
        const updatedComment = await prisma_1.default.comment.update({
            where: { id },
            data: { upvotes: { increment: 1 } }
        });
        return res.status(200).json({ success: true, data: updatedComment });
    }
    catch (error) {
        console.error("[Scams API] Failed to upvote comment:", error);
        return res.status(500).json({ error: "Failed to upvote comment", details: error.message });
    }
});
// Downvote a comment
router.post("/comments/:id/downvote", async (req, res) => {
    const id = req.params.id;
    try {
        const updatedComment = await prisma_1.default.comment.update({
            where: { id },
            data: { downvotes: { increment: 1 } }
        });
        return res.status(200).json({ success: true, data: updatedComment });
    }
    catch (error) {
        console.error("[Scams API] Failed to downvote comment:", error);
        return res.status(500).json({ error: "Failed to downvote comment", details: error.message });
    }
});
// Report a comment
router.post("/comments/:id/report", async (req, res) => {
    const id = req.params.id;
    try {
        const updatedComment = await prisma_1.default.comment.update({
            where: { id },
            data: { reported: true }
        });
        return res.status(200).json({ success: true, data: updatedComment });
    }
    catch (error) {
        console.error("[Scams API] Failed to report comment:", error);
        return res.status(500).json({ error: "Failed to report comment", details: error.message });
    }
});
// Delete a comment (Admin only)
router.delete("/comments/:id", async (req, res) => {
    const id = req.params.id;
    const adminToken = req.headers["x-admin-token"];
    if (adminToken !== "finguard_admin_authenticated") {
        return res.status(403).json({ error: "Unauthorized access. Admin privileges required." });
    }
    try {
        await prisma_1.default.comment.delete({
            where: { id }
        });
        return res.status(200).json({ success: true, message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("[Scams API] Failed to delete comment:", error);
        return res.status(500).json({ error: "Failed to delete comment", details: error.message });
    }
});
exports.default = router;
