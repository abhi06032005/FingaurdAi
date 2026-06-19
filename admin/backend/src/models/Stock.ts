import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
  ticker: string;
  company_name: string;
  peers?: any;
  quarters?: any;
  profit_and_loss?: any;
  balance_sheet?: any;
  cash_flow?: any;
  ratios?: any;
  shareholding?: any;
  lastUpdated: Date;
}

const StockSchema: Schema = new Schema({
  ticker: { type: String, required: true, unique: true, index: true },
  company_name: { type: String, required: true },
  peers: { type: Schema.Types.Mixed },
  quarters: { type: Schema.Types.Mixed },
  profit_and_loss: { type: Schema.Types.Mixed },
  balance_sheet: { type: Schema.Types.Mixed },
  cash_flow: { type: Schema.Types.Mixed },
  ratios: { type: Schema.Types.Mixed },
  shareholding: { type: Schema.Types.Mixed },
  lastUpdated: { type: Date, default: Date.now }
}, { strict: false }); // strict: false allows arbitrary nested objects easily

export default (mongoose.models.Stock || mongoose.model<IStock>('Stock', StockSchema)) as any;
