import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatbotKnowledge extends Document {
  instanceId: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  synonyms: string[];
  priority: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const chatbotKnowledgeSchema = new Schema<IChatbotKnowledge>(
  {
    instanceId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'Other', trim: true },
    content: { type: String, required: true, maxlength: 20000 },
    keywords: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    priority: { type: Number, default: 5, min: 1, max: 10 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: true,
    collection: 'chatbot_knowledge',
  }
);

// Compound index for fast lookup by instance + status + priority
chatbotKnowledgeSchema.index({ instanceId: 1, status: 1, priority: -1 });

export const ChatbotKnowledge: Model<IChatbotKnowledge> = mongoose.model<IChatbotKnowledge>(
  'ChatbotKnowledge',
  chatbotKnowledgeSchema
);
