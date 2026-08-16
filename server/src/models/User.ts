import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export interface IUser extends Document {
  username: string;
  phone?: string;
  password: string;
  role: 'admin' | 'user';
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  lastSeenAt: Date | null;
  isActive: boolean;
  openaiApiKeyEncrypted?: string | null;
  openaiKeyLast4?: string | null;
  geminiApiKeyEncrypted?: string | null;
  geminiKeyLast4?: string | null;
  aiProvider: 'auto' | 'openai' | 'gemini';
  aiAutomationEnabled: boolean;
  aiReplyEnabled: boolean;
  aiOnlyReplyEnabled: boolean;
  aiOwnerName?: string | null;
  aiRelationshipNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      index: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 20,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'admin',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openaiApiKeyEncrypted: { type: String, default: null, select: false },
    openaiKeyLast4: { type: String, default: null },
    geminiApiKeyEncrypted: { type: String, default: null, select: false },
    geminiKeyLast4: { type: String, default: null },
    aiProvider: { type: String, enum: ['auto', 'openai', 'gemini'], default: 'auto' },
    aiAutomationEnabled: { type: Boolean, default: false },
    aiReplyEnabled: { type: Boolean, default: false },
    aiOnlyReplyEnabled: { type: Boolean, default: true },
    aiOwnerName: { type: String, default: null, maxlength: 100 },
    aiRelationshipNotes: { type: String, default: null, maxlength: 5000 },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Hide sensitive fields in JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.failedLoginAttempts;
  delete obj.lockedUntil;
  delete obj.openaiApiKeyEncrypted;
  delete obj.geminiApiKeyEncrypted;
  return obj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
