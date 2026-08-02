import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApiKey extends Document {
  name: string;
  key: string;
  keyHash: string;
  userId: mongoose.Types.ObjectId;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    key: {
      type: String,
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'apikeys',
  }
);

export const ApiKey: Model<IApiKey> = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
