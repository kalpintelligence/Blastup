import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaignButton {
  type: 'reply' | 'url' | 'call';
  displayText: string;
  idOrUrl?: string;
}

export interface ICampaignSliderItem {
  title: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  buttonText?: string;
  buttonId?: string;
}

export interface ICampaign extends Document {
  name: string;
  templateText: string;
  mediaUrl?: string;
  interactiveType?: 'none' | 'button' | 'slider';
  buttons?: ICampaignButton[];
  sliderItems?: ICampaignSliderItem[];
  targetGroups: string[]; // empty array means all contacts
  scheduledAt: Date;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  instanceId: string;
  createdBy: mongoose.Types.ObjectId;
  defaultName?: string; // fallback when contact has no name and template uses {{name}}
  parentCampaignId?: mongoose.Types.ObjectId;
  recampaignFilter?: string;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    templateText: { type: String, required: true },
    mediaUrl: { type: String, default: null },
    interactiveType: { type: String, enum: ['none', 'button', 'slider'], default: 'none' },
    buttons: [
      {
        type: { type: String, enum: ['reply', 'url', 'call'], default: 'reply' },
        displayText: { type: String, required: true },
        idOrUrl: { type: String },
      },
    ],
    sliderItems: [
      {
        title: { type: String, required: true },
        description: { type: String },
        imageUrl: { type: String },
        price: { type: String },
        buttonText: { type: String },
        buttonId: { type: String },
      },
    ],
    targetGroups: { type: [String], default: [] },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    instanceId: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    defaultName: { type: String, default: 'there' }, // fallback for {{name}} when contact name is unknown
    parentCampaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
    recampaignFilter: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'campaigns',
  }
);

campaignSchema.index({ instanceId: 1, createdAt: -1 });

export const Campaign: Model<ICampaign> = mongoose.model<ICampaign>('Campaign', campaignSchema);
