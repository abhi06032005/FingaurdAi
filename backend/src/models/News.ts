import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  description?: string;
  source?: string;
  link: string;
  image?: string;
  category: string;
  publishedAt: Date;
  createdAt: Date;
}

const NewsSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  source: { type: String },
  link: { type: String, required: true, unique: true, index: true },
  image: { type: String },
  category: { type: String, required: true, index: true },
  publishedAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.News || mongoose.model<INews>('News', NewsSchema);
