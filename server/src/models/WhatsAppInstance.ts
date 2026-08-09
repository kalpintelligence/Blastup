import mongoose, { Schema, Document, Model } from 'mongoose';

export type InstanceStatus = 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'error';

export interface IWhatsAppInstance extends Document {
  instanceId: string;
  status: InstanceStatus;
  phone: string | null;
  pushName: string | null;
  profilePicUrl: string | null;
  platform: string | null;
  qrCode: string | null;     // base64 QR image, cleared after scan
  qrExpiresAt: Date | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  lastSyncAt: Date | null;
  sessionPath: string;
  totalChats: number;
  totalContacts: number;
  messagesToday: number;
  messagesSent: number;
  messagesReceived: number;
  autoReconnect: boolean;
  // Safe Mode anti-ban fields
  safeModeEnabled: boolean;
  safeModeStartedAt: Date | null;
  safeModeStartTier: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const whatsAppInstanceSchema = new Schema<IWhatsAppInstance>(
  {
    instanceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['disconnected', 'connecting', 'connected', 'qr_ready', 'error'],
      default: 'disconnected',
    },
    phone: { type: String, default: null },
    pushName: { type: String, default: null },
    profilePicUrl: { type: String, default: null },
    platform: { type: String, default: null },
    qrCode: { type: String, default: null, select: false }, // QR never returned by default
    qrExpiresAt: { type: Date, default: null },
    lastConnectedAt: { type: Date, default: null },
    lastDisconnectedAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    sessionPath: { type: String, required: true },
    totalChats: { type: Number, default: 0 },
    totalContacts: { type: Number, default: 0 },
    messagesToday: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    autoReconnect: { type: Boolean, default: true },
    // Safe Mode anti-ban fields
    safeModeEnabled: { type: Boolean, default: true },
    safeModeStartedAt: { type: Date, default: null },
    safeModeStartTier: { type: Number, default: null },
  },
  {
    timestamps: true,
    collection: 'whatsapp_instances',
  }
);

export const WhatsAppInstance: Model<IWhatsAppInstance> = mongoose.model<IWhatsAppInstance>(
  'WhatsAppInstance',
  whatsAppInstanceSchema
);
