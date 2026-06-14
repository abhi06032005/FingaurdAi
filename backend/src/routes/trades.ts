import express, { Request, Response } from "express";
import Trade from "../models/Trade";
import prisma from "../config/prisma";

const router = express.Router();

// Save new trade
router.post("/", async (req: Request, res: Response): Promise<any> => {
  const tradeData = req.body;
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  try {
    // Verify subscription plan
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user || (user.plan !== "STANDARD" && user.plan !== "PREMIUM")) {
      return res.status(403).json({ error: "Access denied. Standard or Premium subscription plan is required to access the Trading Journal." });
    }

    // Verify Standard plan limit
    if (user.plan === "STANDARD") {
      const tradeCount = await Trade.countDocuments({ userId });
      if (tradeCount >= 50) {
        return res.status(403).json({ error: "Trade limit reached. Standard plan allows up to 50 logs. Please upgrade to Premium Pro for unlimited logs." });
      }
    }

    const trade = await Trade.create({
      userId,
      symbol: tradeData.symbol,
      instrumentType: tradeData.instrumentType,
      direction: tradeData.direction,
      entryPrice: parseFloat(tradeData.entryPrice),
      exitPrice: parseFloat(tradeData.exitPrice),
      quantity: parseFloat(tradeData.quantity),
      entryDate: new Date(tradeData.entryDate),
      exitDate: new Date(tradeData.exitDate),
      
      // Plan
      plannedStopLoss: tradeData.plannedStopLoss ? parseFloat(tradeData.plannedStopLoss) : null,
      plannedTarget: tradeData.plannedTarget ? parseFloat(tradeData.plannedTarget) : null,
      
      // Setup
      strategy: tradeData.strategy,
      confidenceScore: parseInt(tradeData.confidenceScore),
      emotion: tradeData.emotion || null,
      exitReason: tradeData.exitReason || null,
      mistakes: tradeData.mistakes || [],
      
      // Notes
      tradeIdea: tradeData.tradeIdea || null,
      lessonLearned: tradeData.lessonLearned || null,
      
      // Options specific
      optionType: tradeData.optionType || null,
      strikePrice: tradeData.strikePrice ? parseFloat(tradeData.strikePrice) : null,
      expiryDate: tradeData.expiryDate ? new Date(tradeData.expiryDate) : null,
      premiumPaid: tradeData.premiumPaid ? parseFloat(tradeData.premiumPaid) : null,
    });

    return res.status(201).json({ success: true, data: trade });
  } catch (error: any) {
    console.error("[Trades] Failed to save trade:", error);
    return res.status(500).json({ error: "Failed to save trade to database", details: error.message });
  }
});

// Fetch all trades for a user
router.get("/", async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  try {
    // Verify subscription plan
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user || (user.plan !== "STANDARD" && user.plan !== "PREMIUM")) {
      return res.status(403).json({ error: "Access denied. Standard or Premium subscription plan is required to access the Trading Journal." });
    }

    const trades = await Trade.find({ userId })
      .sort({ entryDate: -1 })
      .lean();

    return res.status(200).json({ success: true, data: trades });
  } catch (error: any) {
    console.error("[Trades] Failed to fetch trades:", error);
    return res.status(500).json({ error: "Failed to fetch trades from database", details: error.message });
  }
});

export default router;
