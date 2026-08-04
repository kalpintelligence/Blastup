import mongoose, { Schema, Document, Model } from 'mongoose';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'reaction' | 'location' | 'contact' | 'poll' | 'button' | 'slider' | 'interactive' | 'template' | 'list' | 'unknown';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface IMessage extends Document {
  msgId: string;
  chatId: string;
  instanceId: string;
  from: string;
  to: string;
  fromMe: boolean;
  type: MessageType;
  // Content variants (only one populated based on type)
  text: string | null;
  caption: string | null;
  mediaUrl: string | null;      // Local path to stored media
  mediaMimeType: string | null;
  mediaFileName: string | null;
  mediaSize: number | null;
  // Reply context
  quotedMsgId: string | null;
  quotedText: string | null;
  // Status
  status: MessageStatus;
  timestamp: Date;
  isDeleted: boolean;
  isStarred: boolean;
  // Raw Baileys message (for re-processing)
  rawMessage: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    msgId: { type: String, required: true },
    chatId: { type: String, required: true },
    instanceId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    fromMe: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'reaction', 'location', 'contact', 'poll', 'button', 'slider', 'interactive', 'template', 'list', 'unknown'],
      default: 'text',
    },
    text: { type: String, default: null },
    caption: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaMimeType: { type: String, default: null },
    mediaFileName: { type: String, default: null },
    mediaSize: { type: Number, default: null },
    quotedMsgId: { type: String, default: null },
    quotedText: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    timestamp: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    rawMessage: { type: Schema.Types.Mixed, default: null, select: false },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

messageSchema.index({ msgId: 1, instanceId: 1 }, { unique: true });
messageSchema.index({ chatId: 1, instanceId: 1, timestamp: -1 }); // Paginated message history
messageSchema.index({ instanceId: 1, timestamp: -1 });
messageSchema.index({ instanceId: 1, fromMe: 1, timestamp: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
