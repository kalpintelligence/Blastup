import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  instanceId: { type: String, required: true, index: true },
  sourceHash: { type: String, required: true },
  chatName: { type: String, default: 'WhatsApp export' },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  fromMe: { type: Boolean, default: false, index: true },
  timestamp: { type: Date },
}, { timestamps: true, collection: 'ai_training_messages' });
schema.index({ instanceId: 1, sourceHash: 1 }, { unique: true });
export const AITrainingMessage = mongoose.model('AITrainingMessage', schema);
