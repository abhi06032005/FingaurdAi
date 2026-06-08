import express, { Request, Response } from "express";
import prisma from "../config/prisma";

const router = express.Router();

// Save new trade
router.post("/", async (req: Request, res: Response): Promise<any> => {
  const { userId, ...tradeData } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing Clerk userId in request body" });
  }

  try {
    const trade = await prisma.trade.create({
      data: {
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
      },
    });

    return res.status(201).json({ success: true, data: trade });
  } catch (error: any) {
    console.error("[Trades] Failed to save trade:", error);
    return res.status(500).json({ error: "Failed to save trade to database", details: error.message });
  }
});

// Fetch all trades for a user
router.get("/", async (req: Request, res: Response): Promise<any> => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: "Missing Clerk userId in query parameters" });
  }

  try {
    const trades = await prisma.trade.findMany({
      where: {
        userId,
      },
      orderBy: {
        entryDate: "desc",
      },
    });

    return res.status(200).json({ success: true, data: trades });
  } catch (error: any) {
    console.error("[Trades] Failed to fetch trades:", error);
    return res.status(500).json({ error: "Failed to fetch trades from database", details: error.message });
  }
});

export default router;
