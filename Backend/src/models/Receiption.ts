import mongoose, { Schema, Document, Model } from "mongoose";

export interface Receipt extends Document {
  receiptNumber: string;
  invoiceId: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  paymentDate: Date;
  method: 'Cash' | 'Cheque' | 'Bank Transfer' | 'Mobile Banking' | string;
  currency: 'LAK' | 'USD' | 'THB' | string;
  exchangeRate: number;
  amountPaid: number;
  referenceNumber?: string; 
  description?: string;
  status: 'Confirmed' | 'Cancelled';
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReceiptSchema = new Schema<Receipt>({
  receiptNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true 
  },
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  method: {
    type: String, 
    enum: ['Cash', 'Cheque', 'Bank Transfer', 'Mobile Banking'],
    default: 'Cash',
    required: true
  },
  currency: {
    type: String,
    enum: ['LAK', 'USD', 'THB'],
    required: true
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  amountPaid: { 
    type: Number, 
    required: true,
    min: 0 
  },
  referenceNumber: { 
    type: String, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true,
    default: '' 
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled'],
    default: 'Confirmed'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export const ReceiptModel: Model<Receipt> = 
  (mongoose.models.Receipt as Model<Receipt>) || 
  mongoose.model<Receipt>("Receipt", ReceiptSchema);