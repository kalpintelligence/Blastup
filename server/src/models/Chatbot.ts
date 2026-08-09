import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatbotRule {
  keyword: string;
  response: string;
  matchType: 'exact' | 'contains' | 'startsWith';
}

export interface IChatbot extends Document {
  instanceId: string;
  enabled: boolean;
  // Messages
  welcomeMessage: string;
  fallbackMessage: string;
  offlineMessage: string;
  // Branding & Appearance
  botName: string;
  botIcon: string;
  headerText: string;
  subHeaderText: string;
  buttonLabel: string;
  primaryColor: string;
  secondaryColor: string;
  gradient: boolean;
  gradientAngle: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'classic' | 'glassmorphic';
  // Rules
  rules: IChatbotRule[];
  // Lead Collection
  collectLeads: boolean;
  leadFields: Array<'name' | 'email' | 'phone'>;
  // Timestamps
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
    // Messages
    welcomeMessage: {
      type: String,
      default: 'Hello! Welcome. How can I help you today? 👋',
    },
    fallbackMessage: {
      type: String,
      default: "Sorry, I didn't understand that. Please try again or type 'help'.",
    },
    offlineMessage: {
      type: String,
      default: "We're currently offline. Please leave a message and we'll get back to you.",
    },
    // Branding & Appearance
    botName: { type: String, default: 'Blastup Bot' },
    botIcon: { type: String, default: 'bot' },
    headerText: { type: String, default: 'Chat with us' },
    subHeaderText: { type: String, default: 'We typically reply within minutes' },
    buttonLabel: { type: String, default: 'Chat' },
    primaryColor: { type: String, default: '#25D366' },
    secondaryColor: { type: String, default: '#128C7E' },
    gradient: { type: Boolean, default: true },
    gradientAngle: { type: Number, default: 135 },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right',
    },
    theme: {
      type: String,
      enum: ['classic', 'glassmorphic'],
      default: 'glassmorphic',
    },
    rules: { type: [chatbotRuleSchema], default: [] },
    // Lead Collection
    collectLeads: { type: Boolean, default: false },
    leadFields: {
      type: [String],
      enum: ['name', 'email', 'phone'],
      default: ['name', 'email'],
    },
  },
  {
    timestamps: true,
    collection: 'chatbots',
  }
);

export const Chatbot: Model<IChatbot> = mongoose.model<IChatbot>('Chatbot', chatbotSchema);
