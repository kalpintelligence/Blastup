import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatbotRule {
  keyword: string;
  response: string;
  matchType: 'exact' | 'contains' | 'startsWith';
}

export interface IChatbot extends Document {
  instanceId: string;
  enabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  rules: IChatbotRule[];
  createdAt: Date;
  updatedAt: Date;
}

const chatbotRuleSchema = new Schema<IChatbotRule>({
  keyword: { type: String, required: true },
  response: { type: String, required: true },
  matchType: { type: String, enum: ['exact', 'contains', 'startsWith'], default: 'contains' },
}, { _id: true });

const chatbotSchema = new Schema<IChatbot>(
  {
    instanceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enabled: { type: Boolean, default: false },
    welcomeMessage: {
      type: String,
      default: 'Hello! Welcome. How can I help you today?',
    },
    fallbackMessage: {
      type: String,
      default: "Sorry, I didn't understand that. Please try again or type 'help'.",
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right',
    },
    primaryColor: {
      type: String,
      default: '#25D366',
    },
    rules: { type: [chatbotRuleSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'chatbots',
  }
);

export const Chatbot: Model<IChatbot> = mongoose.model<IChatbot>('Chatbot', chatbotSchema);
