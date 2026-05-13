import mongoose, { Schema, Model, Document } from "mongoose";

interface LineItem {
  item?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'Product' | 'Service';
  unit: 'Item' | 'Hour' | 'Day' | 'Month' | 'Year' | string;
  price: number;
  quantity: number;
  taxRate: number;
  amount: number;    
  taxAmount: number;   
  total: number;       
}

export interface Invoice extends Document {
  invoiceNumber: string;
  quotationRef?: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  description?: string;
  lineItems: LineItem[];
  issueDate: Date;
  dueDate: Date;
  currency: 'LAK' | 'USD' | 'THB' | string;
  exchangeRate: number;
  subtotal: number;
  totalTax: number;
  discount: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  status: 'Pending' | 'Partial' | 'Paid' | 'Cancelled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId; // ✅ เพิ่มเพื่อบันทึกคนสร้าง
  createdAt?: Date;
  updatedAt?: Date;
}

const invoiceSchema = new Schema<Invoice>({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  quotationRef:  { type: Schema.Types.ObjectId, ref: 'Quotation', unique: true, sparse: true },
  customer:      { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  description:   { type: String, trim: true },
  lineItems: [{
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['Product', 'Service'], required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    taxRate: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  issueDate:     { type: Date, default: Date.now },
  dueDate:       { type: Date, required: true },
  currency:      { type: String, enum: ['LAK', 'USD', 'THB'], default: 'LAK' },
  exchangeRate:  { type: Number, default: 1 },
  subtotal:      { type: Number, required: true, default: 0 },
  totalTax:      { type: Number, required: true, default: 0 },
  discount:      { type: Number, default: 0 },
  grandTotal:    { type: Number, required: true, default: 0 },
  totalPaid:     { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Cancelled'],
    default: 'Pending',
  },
  notes: { type: String },
  // ✅ บังคับให้ต้องมีเจ้าของเสมอ
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

invoiceSchema.pre('save', function (this: Invoice) {
  const isLak = this.currency === 'LAK';
  
  this.balanceDue = this.grandTotal - (this.totalPaid || 0);

  if (isLak) {
    this.balanceDue = Math.round(this.balanceDue);
  }

  if (this.status !== 'Cancelled') {
    if (this.totalPaid === 0) {
      this.status = 'Pending';
    } else if (this.totalPaid < this.grandTotal) {
      this.status = 'Partial';
    } else {
      this.status = 'Paid';
    }
  }
});

export const InvoiceModel: Model<Invoice> =
  (mongoose.models.Invoice as Model<Invoice>) ??
  mongoose.model<Invoice>('Invoice', invoiceSchema);