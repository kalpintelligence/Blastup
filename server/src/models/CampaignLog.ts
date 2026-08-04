import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaignLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  phone: string;
  jid: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  instanceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const campaignLogSchema = new Schema<ICampaignLog>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    phone: { type: String, required: true },
    jid: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
      index: true,
    },
    messageId: { type: String, default: null, index: true },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    instanceId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'campaign_logs',
  }
);

campaignLogSchema.index({ campaignId: 1, status: 1 });
campaignLogSchema.index({ campaignId: 1, phone: 1 });

export const CampaignLog: Model<ICampaignLog> = mongoose.model<ICampaignLog>('CampaignLog', campaignLogSchema);
