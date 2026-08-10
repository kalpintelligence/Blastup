import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatbotLeadMessage {
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
}

export interface IChatbotLeadData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export interface IChatbotLead extends Document {
  instanceId: string;
  sessionId: string;
  domain: string;
  pageUrl?: string;
  capturedData: IChatbotLeadData;
  messages: IChatbotLeadMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatbotLeadMessageSchema = new Schema<IChatbotLeadMessage>({
  sender: { type: String, enum: ['user', 'bot', 'agent'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
}, { _id: false });

const chatbotLeadSchema = new Schema<IChatbotLead>(
  {
    instanceId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    domain: { type: String, default: '' },
    pageUrl: { type: String, default: '' },
    capturedData: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      message: { type: String, default: '' },
    },
    messages: { type: [chatbotLeadMessageSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'chatbot_leads',
  }
);

export const ChatbotLead: Model<IChatbotLead> = mongoose.model<IChatbotLead>('ChatbotLead', chatbotLeadSchema);
