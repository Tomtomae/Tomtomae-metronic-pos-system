import mongoose, { Schema, Document, Model } from "mongoose";

export interface Customer extends Document {
  customerCode: string; 
  name: string;
  website?: string;
  avatar?: string;
  contact: {
    name: string;
    phone: string;
  };
  email: string;
  address: {
    village: string;
    district: string;
    province: string;
    postCode: string;
  };
  taxId?: string;
  paymentTerms: 'net30' | 'net45' | 'net60' | 'net90';
  totalOrdersAmount: number;
  status: 'Active' | 'Inactive';
  createdBy: mongoose.Types.ObjectId; // ✅ เพิ่ม: บันทึกว่าใครเป็นคนสร้าง
  createdAt?: Date;
  updatedAt?: Date;
}

const customerSchema = new Schema<Customer>({
  customerCode: { type: String, required: true, unique: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  website: { type: String, default: "" },
  avatar: { type: String, default: "" },
  contact: {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  address: {
    village: { type: String, required: true }, 
    district: { type: String, required: true },
    province: { type: String, required: true },
    postCode: { type: String, required: true }
  },
  taxId: { type: String, default: "" },
  paymentTerms: { type: String, enum: ['net30', 'net45', 'net60', 'net90'], default: 'net30' },
  totalOrdersAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true } 
}, { timestamps: true });

export const CustomerModel: Model<Customer> = 
  (mongoose.models.Customer as Model<Customer>) ?? 
  mongoose.model<Customer>("Customer", customerSchema);