import { Message } from '../models/Message';
import { User } from '../models/User';
import { AITrainingMessage } from '../models/AITrainingMessage';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (value: string) => new Set(normalize(value).split(' ').filter(word => word.length > 1));

function similarity(a: string, b: string) {
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let common = 0; for (const word of left) if (right.has(word)) common++;
  const tokenScore = (2 * common) / (left.size + right.size);
  const leftText = normalize(a); const rightText = normalize(b);
  const trigrams = (value: string) => new Set(Array.from({ length: Math.max(0, value.length - 2) }, (_, index) => value.slice(index, index + 3)));
  const a3 = trigrams(leftText); const b3 = trigrams(rightText);
  let shared = 0; for (const gram of a3) if (b3.has(gram)) shared++;
  const phraseScore = a3.size + b3.size ? (2 * shared) / (a3.size + b3.size) : 0;
  return tokenScore * 0.7 + phraseScore * 0.3;
}

function safeLearnedReply(reply: string, sameChat: boolean) {
  if (!reply || reply.length > 600) return false;
  if (/\b(?:otp|one[ -]?time password|cvv|pin|password|bank account|upi pin)\b/i.test(reply)) return false;
  if (!sameChat && /(?:https?:\/\/|www\.|\b\d{6,}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(reply)) return false;
  return true;
}

function basicReply(text: string) {
  const value = normalize(text);
  const hindi = /[\u0900-\u097f]/.test(text);
  const hinglish = hindi || /\b(?:haan|nahi|nhi|kya|kaise|aap|tum|hai|hain|ho|ji|batao|bataiye|kar|karo|kr|kitna|chahiye|bhej|dena)\b/i.test(value);
  if (/^(hi|hii+|hello|hey|namaste|namaskar|hlo|hola)( ji)?$/.test(value)) return hinglish ? 'hey, kaise ho?' : 'Hey';
  if (/\b(thanks|thank you|thankyou|shukriya|dhanyawad)\b/.test(value)) return hinglish ? 'koi baat nahi' : 'No problem';
  if (/\b(good morning|suprabhat)\b/.test(value)) return hinglish ? 'good morning ji' : 'Good morning';
  if (/\b(price|cost|rate|kitna|charges?)\b/.test(value)) return hinglish ? 'kis cheez ka price chahiye?' : 'Which one do you need the price for?';
  if (/\b(location|address|kahan|where)\b/.test(value)) return hinglish ? 'kis location ki details chahiye?' : 'Which location do you mean?';
  return hinglish ? 'haan ji, thoda detail mein batao' : 'Tell me a little more';
}

export async function generateLocalLearnedReply(instanceId: string, chatId: string, incomingText: string) {
  const user = await User.findById(instanceId).select('aiReplyEnabled').lean();
  if (!user?.aiReplyEnabled || !incomingText.trim()) return null;

  const messages = await Message.find({ instanceId, type: 'text', isDeleted: { $ne: true } })
    .sort({ timestamp: -1 }).limit(3000).select('chatId fromMe text caption timestamp').lean();
  messages.reverse();
  let best: { score: number; reply: string } | null = null;
  const conversations = new Map<string, typeof messages>();
  for (const message of messages) conversations.set(message.chatId, [...(conversations.get(message.chatId) || []), message]);
  for (const conversation of conversations.values()) for (let index = 0; index < conversation.length - 1; index++) {
    const question = conversation[index]; const answer = conversation[index + 1];
    if (question.fromMe || !answer.fromMe || question.chatId !== answer.chatId) continue;
    if (new Date(answer.timestamp).getTime() - new Date(question.timestamp).getTime() > 30 * 60 * 1000) continue;
    const questionText = String(question.text || question.caption || '').trim();
    const replyText = String(answer.text || answer.caption || '').trim();
    const sameChat = question.chatId === chatId;
    if (!safeLearnedReply(replyText, sameChat)) continue;
    const ageDays = Math.max(0, (Date.now() - new Date(answer.timestamp).getTime()) / 86_400_000);
    const recency = Math.max(0, 0.08 - ageDays * 0.001);
    const score = similarity(incomingText, questionText) + (sameChat ? 0.16 : 0) + recency;
    if (score >= 0.55 && (!best || score > best.score)) best = { score, reply: replyText };
  }
  const trained = await AITrainingMessage.find({ instanceId }).sort({ timestamp: 1 }).limit(5000).select('chatName fromMe text timestamp').lean();
  const trainedReplyFrequency = new Map<string, number>();
  for (const message of trained) if (message.fromMe) {
    const key = normalize(message.text); trainedReplyFrequency.set(key, (trainedReplyFrequency.get(key) || 0) + 1);
  }
  const exports = new Map<string, typeof trained>();
  for (const message of trained) exports.set(message.chatName, [...(exports.get(message.chatName) || []), message]);
  for (const conversation of exports.values()) for (let index = 0; index < conversation.length - 1; index++) {
    const question = conversation[index]; const answer = conversation[index + 1];
    if (question.fromMe || !answer.fromMe || !safeLearnedReply(answer.text, false)) continue;
    const styleFrequency = trainedReplyFrequency.get(normalize(answer.text)) || 1;
    if (styleFrequency < 2) continue;
    const score = similarity(incomingText, question.text) + 0.06 + Math.min(0.12, styleFrequency * 0.015);
    if (score >= 0.55 && (!best || score > best.score)) best = { score, reply: answer.text };
  }
  if (/^(?:hi|hii+|hello|hey|namaste|namaskar|hlo|hola)(?: ji)?[.! ]*$/i.test(incomingText.trim())) return basicReply(incomingText);
  return best?.reply || basicReply(incomingText);
}

export async function learnedReplyDelay(instanceId: string, chatId: string) {
  const messages = await Message.find({ instanceId, chatId, type: 'text' })
    .sort({ timestamp: -1 }).limit(80).select('fromMe timestamp').lean();
  messages.reverse();
  const delays: number[] = [];
  for (let index = 1; index < messages.length; index++) {
    if (!messages[index - 1].fromMe && messages[index].fromMe) {
      const seconds = (new Date(messages[index].timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime()) / 1000;
      if (seconds >= 1 && seconds <= 300) delays.push(seconds);
    }
  }
  delays.sort((a, b) => a - b);
  const learned = delays.length ? delays[Math.floor(delays.length / 2)] : 16;
  return Math.round(Math.min(35, Math.max(12, learned)) * 1000);
}
