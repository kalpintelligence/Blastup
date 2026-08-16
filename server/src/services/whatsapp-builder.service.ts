import { Chatbot } from '../models/Chatbot';
import { parseReminder } from './reminder.service';
import { createCampaign } from './campaign.service';

type CampaignDraft = { step: 'name' | 'message' | 'audience' | 'schedule' | 'confirm'; name?: string; message?: string; groups?: string[]; scheduledAt?: Date };
type FlowDraft = { step: 'name' | 'triggers' | 'reply' | 'buttons' | 'confirm'; name?: string; triggers?: string[]; reply?: string; buttons?: string[] };
const campaigns = new Map<string, CampaignDraft>();
const flows = new Map<string, FlowDraft>();
const keyFor = (instanceId: string, chatId: string) => `${instanceId}:${chatId}`;

function scheduleFrom(text: string) {
  if (/^(?:now|abhi|immediately)$/i.test(text.trim())) return new Date();
  return parseReminder(`/t placeholder ${text}`).dueAt;
}

async function saveCampaign(instanceId: string, draft: CampaignDraft) {
  return createCampaign(instanceId, instanceId, { name: draft.name!, templateText: draft.message!, targetGroups: draft.groups || [], scheduledAt: draft.scheduledAt! });
}

async function handleCampaign(instanceId: string, chatId: string, text: string) {
  const key = keyFor(instanceId, chatId);
  if (/^\/c(?:\s+cancel)?$/i.test(text) && /cancel/i.test(text)) { campaigns.delete(key); return { reply: 'Campaign cancelled.' }; }
  if (/^\/c$/i.test(text)) { campaigns.set(key, { step: 'name' }); return { reply: 'Campaign name?' }; }
  const draft = campaigns.get(key); if (!draft) return null;
  if (/^cancel$/i.test(text.trim())) { campaigns.delete(key); return { reply: 'Campaign cancelled.' }; }
  if (draft.step === 'name') { draft.name = text.trim(); draft.step = 'message'; return { reply: 'Message to send? You can use {{name}} and {{phone}}.' }; }
  if (draft.step === 'message') { draft.message = text.trim(); draft.step = 'audience'; return { reply: 'Audience? Reply all, or send group names separated by commas.' }; }
  if (draft.step === 'audience') { draft.groups = /^(?:all|everyone|sab)$/i.test(text.trim()) ? [] : text.split(',').map(value => value.trim()).filter(Boolean); draft.step = 'schedule'; return { reply: 'When should it send? Example: now, tomorrow at 10 AM, in 2 hours.' }; }
  if (draft.step === 'schedule') {
    const scheduledAt = scheduleFrom(text); if (!scheduledAt) return { reply: 'Please send a valid time, such as tomorrow at 10 AM.' };
    draft.scheduledAt = scheduledAt; draft.step = 'confirm';
    return { reply: `Create “${draft.name}” for ${draft.groups?.length ? draft.groups.join(', ') : 'all contacts'} at ${scheduledAt.toLocaleString()}? Reply yes or no.` };
  }
  if (!/^(?:yes|y|haan|ha)$/i.test(text.trim())) { campaigns.delete(key); return { reply: 'Campaign cancelled.' }; }
  await saveCampaign(instanceId, draft); campaigns.delete(key); return { reply: '✅ Done.' };
}

async function saveFlow(instanceId: string, draft: FlowDraft) {
  const stamp = Date.now().toString(36);
  const startId = `wa-start-${stamp}`; const replyId = `wa-message-${stamp}`;
  const nodes = [
    { id: startId, type: 'flowStart', title: draft.name, content: 'WhatsApp trigger', triggers: draft.triggers, nextNodeId: replyId, buttons: [], connections: [replyId], x: 40, y: 160 },
    { id: replyId, type: draft.buttons?.length ? 'mediaButtons' : 'message', title: draft.name, content: draft.reply, buttons: (draft.buttons || []).map((label, index) => ({ id: `${replyId}-b${index + 1}`, label })), connections: [], x: 340, y: 160 },
  ];
  const chatbot = await Chatbot.findOne({ instanceId }).lean();
  const existing = Array.isArray(chatbot?.whatsappFlows) ? chatbot!.whatsappFlows : [];
  await Chatbot.findOneAndUpdate({ instanceId }, { $set: { whatsappFlows: [...existing, ...nodes], whatsappEnabled: true, enabled: true, replySource: 'nocode' }, $setOnInsert: { instanceId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function handleFlow(instanceId: string, chatId: string, text: string) {
  const key = keyFor(instanceId, chatId);
  if (/^\/wac(?:\s+cancel)?$/i.test(text) && /cancel/i.test(text)) { flows.delete(key); return { reply: 'WhatsApp flow cancelled.' }; }
  if (/^\/wac$/i.test(text)) { flows.set(key, { step: 'name' }); return { reply: 'Flow name?' }; }
  const draft = flows.get(key); if (!draft) return null;
  if (/^cancel$/i.test(text.trim())) { flows.delete(key); return { reply: 'WhatsApp flow cancelled.' }; }
  if (draft.step === 'name') { draft.name = text.trim(); draft.step = 'triggers'; return { reply: 'Trigger words? Separate multiple words with commas, for example: hi, hello, help.' }; }
  if (draft.step === 'triggers') { draft.triggers = text.split(',').map(value => value.trim()).filter(Boolean); if (!draft.triggers.length) return { reply: 'Please provide at least one trigger word.' }; draft.step = 'reply'; return { reply: 'What should the chatbot reply?' }; }
  if (draft.step === 'reply') { draft.reply = text.trim(); draft.step = 'buttons'; return { reply: 'Button labels separated by commas, or reply none.' }; }
  if (draft.step === 'buttons') { draft.buttons = /^(?:none|no|skip)$/i.test(text.trim()) ? [] : text.split(',').map(value => value.trim()).filter(Boolean).slice(0, 3); draft.step = 'confirm'; return { reply: `Create flow “${draft.name}” for triggers ${draft.triggers?.join(', ')}? Reply yes or no.` }; }
  if (!/^(?:yes|y|haan|ha)$/i.test(text.trim())) { flows.delete(key); return { reply: 'WhatsApp flow cancelled.' }; }
  await saveFlow(instanceId, draft); flows.delete(key); return { reply: '✅ Done.' };
}

export async function handleWhatsAppBuilderCommand(instanceId: string, chatId: string, text: string) {
  const key = keyFor(instanceId, chatId);
  if (/^\/c\b/i.test(text)) { flows.delete(key); return handleCampaign(instanceId, chatId, text); }
  if (/^\/wac\b/i.test(text)) { campaigns.delete(key); return handleFlow(instanceId, chatId, text); }
  if (campaigns.has(key)) return handleCampaign(instanceId, chatId, text);
  if (flows.has(key)) return handleFlow(instanceId, chatId, text);
  return null;
}
