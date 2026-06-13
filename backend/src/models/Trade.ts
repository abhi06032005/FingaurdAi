import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  userId: string;
  symbol: string;
  instrumentType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: Date;
  exitDate: Date;
  plannedStopLoss?: number;
  plannedTarget?: number;
  strategy: string;
  confidenceScore: number;
  emotion?: string;
  exitReason?: string;
  mistakes: string[];
  tradeIdea?: string;
  lessonLearned?: string;
  optionType?: string;
  strikePrice?: number;
  expiryDate?: Date;
  premiumPaid?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  instrumentType: { type: String, required: true },
  direction: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  entryDate: { type: Date, required: true },
  exitDate: { type: Date, required: true },
  plannedStopLoss: { type: Number },
  plannedTarget: { type: Number },
  strategy: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  emotion: { type: String },
  exitReason: { type: String },
  mistakes: [{ type: String }],
  tradeIdea: { type: String },
  lessonLearned: { type: String },
  optionType: { type: String },
  strikePrice: { type: Number },
  expiryDate: { type: Date },
  premiumPaid: { type: Number }
}, { timestamps: true });

export default mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);
