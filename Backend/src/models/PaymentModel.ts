import mongoose, { Schema, Document, Model } from "mongoose";

export interface Payment extends Document {
  paymentNumber: string;
  invoice?: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  currency: string;
  exchangeRate: number;
  amount: number;      
  invoiceTotalSnapshot: number; 
  method: 'Cash' | 'Transfer' ; 
  reference?: string; 
  notes?: string;
  paymentDate: Date;
  status: 'Completed' | 'Cancelled';
  createdBy: mongoose.Types.ObjectId; // ✅ เพิ่ม: บันทึกว่าพนักงานคนไหนรับเงิน
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new Schema<Payment>({
  paymentNumber: { type: String, required: true, unique: true, index: true },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: false },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  currency: { type: String, required: true },
  exchangeRate: { type: Number, default: 1 },
  amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
  invoiceTotalSnapshot: { type: Number }, 
  method: { type: String, enum: ['Cash', 'Transfer'], required: true },
  reference: { type: String, trim: true },
  notes: { type: String, trim: true },
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Completed', 'Cancelled'], default: 'Completed' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const PaymentModel: Model<Payment> = 
  (mongoose.models.Payment as Model<Payment>) ?? 
  mongoose.model<Payment>('Payment', paymentSchema);