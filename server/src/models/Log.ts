import mongoose, { Schema, Document, Model } from 'mongoose';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogCategory = 'auth' | 'whatsapp' | 'api' | 'system' | 'message' | 'security';

export interface ILog extends Document {
  level: LogLevel;
  category: LogCategory;
  message: string;
  meta: Record<string, unknown>;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  timestamp: Date;
}

const logSchema = new Schema<ILog>(
  {
    level: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['auth', 'whatsapp', 'api', 'system', 'message', 'security'],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    userId: { type: String, default: null, index: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'logs',
    // No timestamps - use explicit timestamp field
  }
);

// Compound index for filtered log queries
logSchema.index({ category: 1, level: 1, timestamp: -1 });
// TTL: auto-delete logs after 30 days
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const Log: Model<ILog> = mongoose.model<ILog>('Log', logSchema);
