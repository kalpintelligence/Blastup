import { Message } from '../models/Message';

const ACKNOWLEDGEMENT = /^(?:done|ok(?:ay)?|haan(?:\s+ji)?|ha(?:\s+ji)?|ho gaya|kar diya|theek hai|thik hai|sure|yes|yep|ji|acha|achha|ठीक है|हो गया)[.! ]*$/i;

export async function learnedAcknowledgement(instanceId: string, chatId: string, incomingText: string) {
  const messages = await Message.find({ instanceId, fromMe: true, type: 'text' })
    .sort({ timestamp: -1 }).limit(2000).select('chatId text caption').lean();
  const scores = new Map<string, { text: string; score: number }>();
  for (const message of messages) {
    const text = String(message.text || message.caption || '').trim();
    if (!text || text.includes('✅') || !ACKNOWLEDGEMENT.test(text)) continue;
    const key = text.toLocaleLowerCase();
    const current = scores.get(key) || { text, score: 0 };
    current.score += message.chatId === chatId ? 4 : 1;
    scores.set(key, current);
  }
  const learned = [...scores.values()].sort((left, right) => right.score - left.score)[0]?.text;
  if (learned) return learned;
  const hinglish = /\b(?:mujhe|mere|haan|nahi|kya|kaise|aap|tum|hai|ho|ji|bhej|dena|kar|baad|bad)\b/i.test(incomingText) || /[\u0900-\u097f]/.test(incomingText);
  return hinglish ? 'ho gaya' : 'done';
}

export async function naturalizeSystemReply(instanceId: string, chatId: string, incomingText: string, reply: string) {
  if (/^✅\s*Done\.?$/i.test(reply.trim())) return learnedAcknowledgement(instanceId, chatId, incomingText);
  return reply;
}
