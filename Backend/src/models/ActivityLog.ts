import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string; // เช่น 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'PAYMENT_RECEIVED'
  module: string; // เช่น 'Quotation', 'Invoice', 'Customer', 'Receipt', 'Item'
  targetId?: mongoose.Types.ObjectId; // ID ของข้อมูลที่ถูกกระทำ
  details: string; // รายละเอียดเพิ่มเติม
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId },
  details: { type: String, default: '' }
}, { 
  timestamps: { createdAt: true, updatedAt: false } // ต้องการแค่เวลาที่สร้าง
});

export const ActivityLogModel: Model<IActivityLog> = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);