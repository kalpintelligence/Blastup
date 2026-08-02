import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChat extends Document {
  chatId: string;        // WhatsApp chat JID
  instanceId: string;
  name: string | null;
  profilePicUrl: string | null;
  isGroup: boolean;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  unreadCount: number;
  lastMessage: {
    content: string;
    timestamp: Date;
    fromMe: boolean;
    type: string;
  } | null;
  lastSeen: Date | null;
  participants: string[];  // for groups
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    instanceId: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, default: null },
    profilePicUrl: { type: String, default: null },
    isGroup: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 },
    lastMessage: {
      content: String,
      timestamp: Date,
      fromMe: Boolean,
      type: { type: String },
    },
    lastSeen: { type: Date, default: null },
    participants: [{ type: String }],
  },
  {
    timestamps: true,
    collection: 'chats',
  }
);

chatSchema.index({ chatId: 1, instanceId: 1 }, { unique: true });
chatSchema.index({ instanceId: 1, 'lastMessage.timestamp': -1 }); // Sort by recent
chatSchema.index({ instanceId: 1, isPinned: 1 });
chatSchema.index({ name: 'text' }); // Text search

export const Chat: Model<IChat> = mongoose.model<IChat>('Chat', chatSchema);
