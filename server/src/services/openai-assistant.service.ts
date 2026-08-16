import { User } from '../models/User';
import { Message } from '../models/Message';
import { decrypt } from '../utils/crypto';
import { logger } from '../config/logger';
import { AITrainingMessage } from '../models/AITrainingMessage';

export type AIRoute = { intent: 'task' | 'campaign' | 'chatbot_flow' | 'report' | 'none'; command: string };
type CloudProvider = { name: 'openai' | 'gemini'; key: string };
const aiConversationMemory = new Map<string, Array<{ role: 'Customer' | 'You'; text: string }>>();

function trainingStyleProfile(messages: Array<{ text: string }>) {
  const values = messages.map(message => message.text.trim()).filter(Boolean);
  if (!values.length) return 'No uploaded style data yet. Be brief, casual, and match the customer language.';
  const avg = Math.round(values.reduce((sum, value) => sum + value.length, 0) / values.length);
  const hinglishWords = /\b(?:ha|haan|nhi|nahi|kya|kaise|hai|ho|bhai|yr|yaar|kr|kar|bta|bata|acha|accha|thik|theek|hn|ji)\b/i;
  const hinglish = Math.round(values.filter(value => hinglishWords.test(value) || /[\u0900-\u097f]/.test(value)).length / values.length * 100);
  const emoji = Math.round(values.filter(value => /[\u{1F300}-\u{1FAFF}]/u.test(value)).length / values.length * 100);
  const punctuation = Math.round(values.filter(value => /[.!?]$/.test(value)).length / values.length * 100);
  const vocabulary = ['ha', 'haan', 'nhi', 'nahi', 'kya', 'kaise', 'bhai', 'yr', 'yaar', 'kr', 'kar', 'bta', 'bata', 'acha', 'accha', 'thik', 'theek', 'hn', 'ji'];
  const common = vocabulary.map(word => ({ word, count: values.filter(value => new RegExp(`\\b${word}\\b`, 'i').test(value)).length })).filter(item => item.count >= 2).sort((a, b) => b.count - a.count).slice(0, 8).map(item => item.word);
  return `Average message length ${avg} characters. Hinglish used in ${hinglish}% of messages. Emojis used in ${emoji}%. Ending punctuation used in ${punctuation}%. Repeated casual spellings: ${common.join(', ') || 'none strongly repeated'}.`;
}

export async function checkOpenAICreditAvailability(instanceId: string) {
  const config = await settings(instanceId);
  if (!config?.providers.length) return { percentage: null, status: 'not_configured', message: 'No cloud AI key configured' };
  const errors: string[] = [];
  for (const provider of config.providers) try {
    await providerResponse(provider, 'Reply only OK.', 'OK', 4);
    return { percentage: 100, status: 'available', message: `${provider.name === 'openai' ? 'OpenAI' : 'Gemini'} API available` };
  } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  const exhausted = errors.some(message => /429|quota|billing|resource_exhausted/i.test(message));
  return { percentage: exhausted ? 0 : null, status: exhausted ? 'exhausted' : 'error', message: errors.join(' · ').slice(0, 240) };
}

async function settings(instanceId: string) {
  const user = await User.findById(instanceId).select('+openaiApiKeyEncrypted +geminiApiKeyEncrypted').lean();
  if (!user) return null;
  const available: CloudProvider[] = [];
  try { if (user.openaiApiKeyEncrypted) available.push({ name: 'openai', key: decrypt(user.openaiApiKeyEncrypted) }); } catch { logger.error(`[${instanceId}] Could not decrypt OpenAI API key`); }
  try { if (user.geminiApiKeyEncrypted) available.push({ name: 'gemini', key: decrypt(user.geminiApiKeyEncrypted) }); } catch { logger.error(`[${instanceId}] Could not decrypt Gemini API key`); }
  const selected = user.aiProvider || 'auto';
  const providers = selected === 'auto' ? available : available.filter(provider => provider.name === selected);
  return { providers, automation: !!user.aiAutomationEnabled, reply: !!user.aiReplyEnabled, ownerName: user.aiOwnerName || '', relationshipNotes: user.aiRelationshipNotes || '' };
}

export async function isCloudChatReplyEnabled(instanceId: string) {
  const config = await settings(instanceId);
  return !!config?.reply && config.providers.length > 0;
}

export async function getChatReplyMode(instanceId: string) {
  const user = await User.findById(instanceId).select('aiReplyEnabled aiOnlyReplyEnabled').lean();
  const config = await settings(instanceId);
  return { enabled: !!user?.aiReplyEnabled, aiOnly: user?.aiOnlyReplyEnabled !== false, cloudConfigured: !!config?.providers.length };
}

async function providerResponse(provider: CloudProvider, instructions: string, input: string, maxOutputTokens = 300) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const isOpenAI = provider.name === 'openai';
    const response = await fetch(isOpenAI ? 'https://api.openai.com/v1/responses' : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST', signal: controller.signal,
      headers: isOpenAI ? { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json' } : { 'x-goog-api-key': provider.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(isOpenAI
        ? { model: 'gpt-4.1-mini', store: false, instructions, input, max_output_tokens: maxOutputTokens }
        : { system_instruction: { parts: [{ text: instructions }] }, contents: [{ role: 'user', parts: [{ text: input }] }], generationConfig: { maxOutputTokens } }),
    });
    const data = await response.json() as any;
    if (!response.ok) {
      const apiMessage = String(data?.error?.message || 'Request failed').replace(/\s+/g, ' ').slice(0, 300);
      throw new Error(`${isOpenAI ? 'OpenAI' : 'Gemini'} ${response.status}: ${apiMessage}`);
    }
    const text = String(isOpenAI ? (data.output_text || data.output?.flatMap((item: any) => item.content || []).find((item: any) => item.type === 'output_text')?.text || '') : (data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '')).trim();
    if (!text) throw new Error(`${isOpenAI ? 'OpenAI' : 'Gemini'} returned no reply`);
    return text;
  } finally { clearTimeout(timer); }
}

async function responseText(config: NonNullable<Awaited<ReturnType<typeof settings>>>, instructions: string, input: string, maxOutputTokens = 300) {
  const errors: string[] = [];
  for (const provider of config.providers) try { return await providerResponse(provider, instructions, input, maxOutputTokens); }
  catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  throw new Error(errors.join(' · ') || 'No selected AI provider is configured');
}

export async function understandAutomation(instanceId: string, text: string): Promise<AIRoute | null> {
  const config = await settings(instanceId);
  if (!config?.automation || !config.providers.length || !text.trim() || text.trim().startsWith('/')) return null;
  try {
    const raw = await responseText(config,
      `Route a WhatsApp owner's request. Return ONLY JSON: {"intent":"task|campaign|chatbot_flow|report|none","command":"..."}. Preserve names, numbers, message text, dates and times. Task/reminder/scheduled message command starts /t. Report starts /r. Campaign is /c. Chatbot flow is /wac. Current India time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`, text);
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')) as AIRoute;
    return ['task', 'campaign', 'chatbot_flow', 'report', 'none'].includes(parsed.intent) ? parsed : null;
  } catch (error) {
    logger.warn(`[${instanceId}] OpenAI automation understanding failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function generateChatReply(instanceId: string, chatId: string, incomingText: string): Promise<string | null> {
  const config = await settings(instanceId);
  if (!config?.reply || !config.providers.length || !incomingText.trim()) return null;
  try {
    const history = await Message.find({ instanceId, chatId }).sort({ timestamp: -1 }).limit(12).lean();
    const ordered = history.reverse();
    const memoryKey = `${instanceId}:${chatId}`;
    const memory = aiConversationMemory.get(memoryKey) || [];
    const storedTranscript = ordered.map(m => `${m.fromMe ? 'You' : 'Customer'}: ${m.text || m.caption || `[${m.type}]`}`);
    const memoryTranscript = memory.map(message => `${message.role}: ${message.text}`);
    const transcript = [...storedTranscript, ...memoryTranscript].slice(-20).join('\n');
    const previousReplies = ordered.filter(message => message.fromMe).map(message => String(message.text || message.caption || '')).filter(Boolean);
    const trained = await AITrainingMessage.find({ instanceId, fromMe: true }).sort({ timestamp: -1 }).limit(1000).select('text').lean();
    const styleProfile = trainingStyleProfile(trained);
    const averageLength = previousReplies.length ? Math.round(previousReplies.reduce((sum, reply) => sum + reply.length, 0) / previousReplies.length) : 35;
    const usesEmoji = previousReplies.some(reply => /[\u{1F300}-\u{1FAFF}]/u.test(reply));
    const customerLanguageSample = [...ordered.filter(message => !message.fromMe).slice(-6).map(message => String(message.text || message.caption || '')), incomingText].join(' ');
    const hinglish = /\b(?:haan|nahi|nhi|kya|kaise|aap|tum|hai|hain|ho|ji|batao|bataiye|kar|karo|kr|mil|kal|aaj|abhi|theek|thik|chahiye|bhej|dena)\b/i.test(customerLanguageSample);
    const hindi = /[\u0900-\u097f]/.test(customerLanguageSample);
    const language = hindi ? 'Hindi' : hinglish ? 'Hinglish written in Roman script' : 'English';
    const liveConversation = transcript.endsWith(incomingText) ? transcript : `${transcript}\nCustomer: ${incomingText}`;
    const factualDraft = await responseText(config,
      `Understand the live WhatsApp conversation before writing. Answer the customer's LATEST message directly and logically. Resolve short follow-ups such as “kab”, “kaha”, “kyu”, “ur”, and “tujhse pucha” from the immediately preceding messages. Use only facts in the live conversation and these owner-supplied relationship facts:\n${config.relationshipNotes || 'None supplied.'}\nDo not use uploaded style examples. Do not guess missing facts. When something is unknown, say so or ask the exact relevant follow-up. Return one concise meaning-correct draft.`,
      liveConversation, 120);
    const finalReply = await responseText(config,
      `Rewrite the DRAFT only for surface writing style. Preserve its exact meaning, subject, answer, uncertainty, names and question. Never introduce a topic or fact absent from the DRAFT. Write like ${config.ownerName || 'the human owner'} in ${language}. Uploaded chats were reduced to statistics, so their old topics must never appear. STYLE PROFILE: ${styleProfile} Current-chat average length: ${averageLength}. ${usesEmoji ? 'Use an emoji only if natural.' : 'Do not use emojis.'} Never sound like a bot. Return only the rewritten draft.`,
      `DRAFT: ${factualDraft}`, 100);
    aiConversationMemory.set(memoryKey, [...memory, { role: 'Customer' as const, text: incomingText }, { role: 'You' as const, text: finalReply }].slice(-12));
    return finalReply;
  } catch (error) {
    logger.warn(`[${instanceId}] OpenAI chat reply failed: ${error instanceof Error ? error.message : String(error)}`, { chatId });
    return null;
  }
}
