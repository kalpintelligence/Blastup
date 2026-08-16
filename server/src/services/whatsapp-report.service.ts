import { Campaign } from '../models/Campaign';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { Reminder } from '../models/Reminder';

const MAX_POINTS = 15;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function dateRange(text: string) {
  const now = new Date();
  if (/\btoday|aaj\b/i.test(text)) { const from = new Date(now); from.setHours(0, 0, 0, 0); return { from }; }
  if (/\byesterday|kal\b/i.test(text)) { const from = new Date(now); from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0); const to = new Date(from); to.setDate(to.getDate() + 1); return { from, to }; }
  const lastDays = text.match(/(?:last|pichle)\s+(\d+)\s+days?/i);
  if (lastDays) return { from: new Date(now.getTime() - Number(lastDays[1]) * 86_400_000) };
  return {};
}

function normalizedPhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) digits = `91${digits}`;
  return digits;
}

async function conversationReport(instanceId: string, request: string) {
  const rawPhone = request.match(/\+?\d{10,15}/)?.[0];
  const nameRequest = request.match(/(?:summary|messages?|chat|conversation)\s+(?:of|for|with)?\s*([a-z][a-z\s]+?)(?=\s+(?:today|yesterday|last|all|in|points?)\b|$)/i)?.[1]?.trim();
  const phone = rawPhone ? normalizedPhone(rawPhone) : '';
  const contact = phone
    ? await Contact.findOne({ instanceId, $or: [{ phone: new RegExp(`${phone.slice(-10)}$`) }, { jid: new RegExp(`^${phone}`) }] }).lean()
    : nameRequest ? await Contact.findOne({ instanceId, $or: [{ name: new RegExp(escapeRegex(nameRequest), 'i') }, { pushName: new RegExp(escapeRegex(nameRequest), 'i') }] }).lean() : null;
  const identifiers = new Set<string>();
  if (contact?.jid) identifiers.add(contact.jid);
  if (phone) { identifiers.add(`${phone}@s.whatsapp.net`); identifiers.add(`${phone.slice(-10)}@s.whatsapp.net`); }
  const or: Record<string, unknown>[] = [];
  for (const value of identifiers) or.push({ chatId: value }, { from: value }, { to: value });
  if (phone) or.push({ chatId: new RegExp(phone.slice(-10)) }, { from: new RegExp(phone.slice(-10)) }, { to: new RegExp(phone.slice(-10)) });
  if (!or.length) return 'I could not identify the contact. Use /r followed by a phone number.';
  const range = dateRange(request); const timestamp: Record<string, Date> = {};
  if (range.from) timestamp.$gte = range.from; if (range.to) timestamp.$lt = range.to;
  const query: Record<string, unknown> = { instanceId, $or: or };
  if (Object.keys(timestamp).length) query.timestamp = timestamp;
  const limit = /\ball\b/i.test(request) ? 100 : 40;
  const messages = await Message.find(query).sort({ timestamp: -1 }).limit(limit).lean();
  if (!messages.length) return `No stored messages found for ${contact?.name || contact?.pushName || rawPhone || nameRequest}.`;
  messages.reverse();
  const incoming = messages.filter(message => !message.fromMe).length;
  const outgoing = messages.length - incoming;
  const points = messages
    .map(message => ({ direction: message.fromMe ? 'You' : (contact?.name || contact?.pushName || 'Contact'), text: (message.text || message.caption || '').trim(), at: message.timestamp }))
    .filter(point => point.text)
    .slice(-MAX_POINTS)
    .map(point => `• ${point.direction}: ${point.text.slice(0, 220)} (${new Date(point.at).toLocaleString()})`);
  const omitted = messages.filter(message => message.text || message.caption).length - points.length;
  return [`📊 ${contact?.name || contact?.pushName || rawPhone || 'Conversation'}`, `Messages: ${messages.length} · Received: ${incoming} · Sent: ${outgoing}`, ...points, omitted > 0 ? `• …and ${omitted} older messages not shown.` : ''].filter(Boolean).join('\n');
}

async function taskReport(instanceId: string, request: string) {
  const filter: Record<string, unknown> = { instanceId };
  if (/pending|todo|scheduled/i.test(request)) filter.status = 'todo';
  else if (/progress|working/i.test(request)) filter.status = 'in_progress';
  else if (/completed|done/i.test(request)) filter.status = 'completed';
  else if (/failed/i.test(request)) filter.deliveryStatus = 'failed';
  const tasks = await Reminder.find(filter).sort({ dueAt: 1 }).limit(10).lean();
  if (!tasks.length) return 'No matching tasks found.';
  return ['📋 Task report', ...tasks.map(task => `• #${task.taskId} ${task.title} — ${task.status}, ${new Date(task.dueAt).toLocaleString()}${task.actionType === 'SEND_MESSAGE' ? `, delivery: ${task.deliveryStatus}` : ''}`)].join('\n');
}

async function campaignReport(instanceId: string) {
  const campaigns = await Campaign.find({ instanceId }).sort({ createdAt: -1 }).limit(8).lean();
  if (!campaigns.length) return 'No campaigns found.';
  return ['📣 Campaign report', ...campaigns.map(campaign => `• ${campaign.name} — ${campaign.status}; sent ${campaign.stats?.sent || 0}/${campaign.stats?.total || 0}, delivered ${campaign.stats?.delivered || 0}, failed ${campaign.stats?.failed || 0}`)].join('\n');
}

async function overview(instanceId: string) {
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const [contacts, messages, received, sent, pendingTasks, scheduledCampaigns] = await Promise.all([
    Contact.countDocuments({ instanceId }), Message.countDocuments({ instanceId, timestamp: { $gte: from } }),
    Message.countDocuments({ instanceId, timestamp: { $gte: from }, fromMe: false }), Message.countDocuments({ instanceId, timestamp: { $gte: from }, fromMe: true }),
    Reminder.countDocuments({ instanceId, status: { $in: ['todo', 'in_progress'] } }), Campaign.countDocuments({ instanceId, status: { $in: ['scheduled', 'processing'] } }),
  ]);
  return `📈 Today\n• Messages: ${messages}\n• Received: ${received}\n• Sent: ${sent}\n• Contacts: ${contacts}\n• Open tasks: ${pendingTasks}\n• Active campaigns: ${scheduledCampaigns}`;
}

export async function handleWhatsAppReportCommand(instanceId: string, text: string) {
  if (!/^\/r(?:\s|$)/i.test(text)) return null;
  const request = text.replace(/^\/r\s*/i, '').trim();
  if (!request || /^help$/i.test(request)) return { reply: 'Reports:\n/r today\n/r 9506521413 all messages in points\n/r summary with Rahul last 7 days\n/r pending tasks\n/r campaigns\n/r contacts' };
  if (/\b(task|reminder|scheduled message)s?\b/i.test(request)) return { reply: await taskReport(instanceId, request) };
  if (/\bcampaigns?|broadcasts?\b/i.test(request)) return { reply: await campaignReport(instanceId) };
  if (/\bcontacts?\b/i.test(request)) return { reply: `👥 Contacts: ${await Contact.countDocuments({ instanceId })}` };
  if (/\d{10,15}|\b(?:summary|messages?|chat|conversation)\b/i.test(request)) return { reply: await conversationReport(instanceId, request) };
  if (/today|aaj|overview|report|stats|summary/i.test(request)) return { reply: await overview(instanceId) };
  return { reply: 'I can report on chats, phone numbers, tasks, campaigns, contacts, and today’s activity. Send /r help for examples.' };
}
