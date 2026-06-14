import mongoose, { Schema, Document } from 'mongoose';

export interface IAiReport extends Document {
  symbol: string;
  candleDate: Date;
  summary: string;
  indicators: Record<string, unknown>;
  generatedAt: Date;
  modelUsed: string;
}

const AiReportSchema: Schema = new Schema({
  symbol: { type: String, required: true, index: true },
  candleDate: { type: Date, required: true },
  summary: { type: String, required: true },
  indicators: { type: Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
  modelUsed: { type: String, required: true }
});

// Compound index to quickly fetch cached summaries
AiReportSchema.index({ symbol: 1, candleDate: -1 });

export default mongoose.models.AiReport || mongoose.model<IAiReport>('AiReport', AiReportSchema);
