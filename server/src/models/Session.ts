import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string; // SHA-256 hash of JWT - never store raw token
  ip: string;
  userAgent: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index - auto-delete expired sessions
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// Compound index for lookup
sessionSchema.index({ userId: 1, isRevoked: 1 });

export const Session: Model<ISession> = mongoose.model<ISession>('Session', sessionSchema);
