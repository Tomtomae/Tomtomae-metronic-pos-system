import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;    
  type: 'QUOTATION_APPROVAL' | 'QUOTATION_APPROVED' | 'QUOTATION_REJECTED' | 'SYSTEM_ALERT';
  referenceId?: mongoose.Types.ObjectId; 
  message: string; 
  isRead: boolean; 
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  referenceId: { type: Schema.Types.ObjectId }, 
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const NotificationModel: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);