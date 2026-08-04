import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContact extends Document {
  jid: string;           // WhatsApp JID (phone@s.whatsapp.net)
  phone: string;
  name: string | null;
  pushName: string | null;
  profilePicUrl: string | null;
  isBlocked: boolean;
  isBusiness: boolean;
  about: string | null;
  groups: string[];
  instanceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    jid: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    name: { type: String, default: null },
    pushName: { type: String, default: null },
    profilePicUrl: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
    isBusiness: { type: Boolean, default: false },
    about: { type: String, default: null },
    groups: { type: [String], default: [] },
    instanceId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'contacts',
  }
);

// Unique per instance
contactSchema.index({ jid: 1, instanceId: 1 }, { unique: true });
contactSchema.index({ groups: 1 });
// Text search
contactSchema.index({ name: 'text', pushName: 'text', phone: 'text' });

export const Contact: Model<IContact> = mongoose.model<IContact>('Contact', contactSchema);
