import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: string;
  orderId: string;
  amount: number;
  plan: 'STANDARD' | 'PREMIUM';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentGatewayId: string | null;
  processed: boolean;
  contact?: string;
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  plan: {
    type: String,
    enum: ['STANDARD', 'PREMIUM'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  paymentGatewayId: {
    type: String,
    default: null
  },
  processed: {
    type: Boolean,
    default: false
  },
  contact: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
