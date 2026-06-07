import * as z from "zod";

export const tradeSchema = z
  .object({
    symbol: z.string().min(1, "Symbol is required").toUpperCase(),
    instrumentType: z.enum(["Equity", "Futures", "Options"], {
      message: "Please select an instrument type",
    }),
    direction: z.enum(["Long", "Short"], {
      message: "Please select a direction",
    }),
    entryPrice: z.coerce.number().positive("Entry price must be positive"),
    exitPrice: z.coerce.number().positive("Exit price must be positive"),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    entryDate: z.string().min(1, "Entry date is required"),
    exitDate: z.string().min(1, "Exit date is required"),

    // Trade Plan
    plannedStopLoss: z.coerce.number().optional(),
    plannedTarget: z.coerce.number().optional(),

    // Trade Setup
    strategy: z.string().min(1, "Strategy is required"),

    // Confidence
    confidenceScore: z.number().min(1).max(10),

    // Emotion
    emotion: z.string().optional(),

    // Exit Reason
    exitReason: z.string().optional(),

    // Mistakes
    mistakes: z.array(z.string()).default([]),

    // Notes
    tradeIdea: z.string().max(500, "Max 500 characters").optional(),
    lessonLearned: z.string().max(500, "Max 500 characters").optional(),

    // Options Specific
    optionType: z.enum(["CE", "PE"]).optional(),
    strikePrice: z.coerce.number().optional(),
    expiryDate: z.string().optional(),
    premiumPaid: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.instrumentType === "Options") {
      if (!data.optionType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Option Type is required for Options",
          path: ["optionType"],
        });
      }
      if (!data.strikePrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Strike Price is required for Options",
          path: ["strikePrice"],
        });
      }
      if (!data.expiryDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiry Date is required for Options",
          path: ["expiryDate"],
        });
      }
      if (!data.premiumPaid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Premium Paid is required for Options",
          path: ["premiumPaid"],
        });
      }
    }
  });

export type TradeFormValues = z.infer<typeof tradeSchema>;
