import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReminderActionType = 'REMINDER' | 'SEND_MESSAGE';
export type ReminderStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type DeliveryStatus = 'not_applicable' | 'pending' | 'sending' | 'retry_pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export interface IReminder extends Document {
  instanceId: string; chatId: string; taskId: number; actionType: ReminderActionType;
  sourceMessageId?: string;
  title: string; status: ReminderStatus; dueAt: Date; timezone: string; createdBy: string;
  contactName?: string; contactPhone?: string; contactId?: string; contactJid?: string;
  messageContent?: string; deliveryStatus: DeliveryStatus; lastDeliveryAttempt?: Date;
  nextDeliveryAttempt?: Date; deliveredAt?: Date; whatsappMessageId?: string;
  failureReason?: string; retryCount: number; reminderCount: number;
  reminderIntervalMinutes: number; reminderTimes: Date[]; remindersSent: number;
  lastReminderSent?: Date; nextReminderScheduled?: Date;
  history: Array<{ at?: Date; type: string; message: string }>;
  createdAt: Date; updatedAt: Date;
}

const historyEntrySchema = new Schema({
  at: { type: Date, default: Date.now },
  type: { type: String, required: true },
  message: { type: String, required: true },
}, { _id: false });

const reminderSchema = new Schema<IReminder>({
  instanceId: { type: String, required: true, index: true },
  chatId: { type: String, required: true, index: true },
  taskId: { type: Number, required: true },
  sourceMessageId: { type: String },
  actionType: { type: String, enum: ['REMINDER', 'SEND_MESSAGE'], default: 'REMINDER', index: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'completed', 'cancelled'], default: 'todo', index: true },
  dueAt: { type: Date, required: true, index: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  createdBy: { type: String, required: true, default: 'whatsapp' },
  contactName: String, contactPhone: String, contactId: String, contactJid: String,
  messageContent: String,
  deliveryStatus: { type: String, enum: ['not_applicable', 'pending', 'sending', 'retry_pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'], default: 'not_applicable', index: true },
  lastDeliveryAttempt: Date, nextDeliveryAttempt: Date, deliveredAt: Date,
  whatsappMessageId: String, failureReason: String, retryCount: { type: Number, default: 0 },
  reminderCount: { type: Number, default: 1 }, reminderIntervalMinutes: { type: Number, default: 10 },
  reminderTimes: { type: [Date], default: [] }, remindersSent: { type: Number, default: 0 },
  lastReminderSent: Date, nextReminderScheduled: Date,
  history: { type: [historyEntrySchema], default: [] },
}, { timestamps: true, collection: 'reminders' });

reminderSchema.index({ instanceId: 1, taskId: 1 }, { unique: true });
reminderSchema.index({ sourceMessageId: 1 }, { unique: true, sparse: true });
reminderSchema.index({ actionType: 1, status: 1, nextDeliveryAttempt: 1 });
export const Reminder: Model<IReminder> = mongoose.model<IReminder>('Reminder', reminderSchema);
