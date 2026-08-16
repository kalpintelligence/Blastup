import { Contact, IContact } from '../models/Contact';
import { Reminder } from '../models/Reminder';
import { getSocket } from './whatsapp.service';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

const TIMEZONE = process.env.REMINDER_TIMEZONE || 'Asia/Kolkata';
const MAX_RETRIES = 3;
const numberWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5 };
const number = (value?: string) => value ? (Number(value) || numberWords[value.toLowerCase()] || 1) : 1;

type ParsedTask = { actionType: 'REMINDER' | 'SEND_MESSAGE'; title?: string; dueAt?: Date; count: number; interval: number; contactName?: string; messageContent?: string; sendToCurrentChat?: boolean };
type PendingContact = { instanceId: string; chatId: string; parsed: ParsedTask; contacts: IContact[]; sourceMessageId?: string };
const pendingContacts = new Map<string, PendingContact>();
const pendingKey = (instanceId: string, chatId: string) => `${instanceId}:${chatId}`;

function normalizeTaskPhone(value: string): { digits: string; display: string; jid: string } | undefined {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) digits = `91${digits}`;
  if (!/^\d{8,15}$/.test(digits)) return undefined;
  return { digits, display: `+${digits}`, jid: `${digits}@s.whatsapp.net` };
}

function deliveryJid(contactJid?: string, contactPhone?: string) {
  if (contactJid?.endsWith('@lid') || contactJid?.endsWith('@g.us')) return contactJid;
  const phone = normalizeTaskPhone(contactPhone || contactJid || '');
  return phone?.jid || contactJid;
}

function parseDateTime(input: string, now = new Date()): Date | undefined {
  const amountPattern = '(\\d+|one|two|three|four|five|ek|do|teen|char|chaar|paanch)';
  const relative = input.match(new RegExp(`(?:in|after|baad|bad|baad\\s+mein)\\s*${amountPattern}\\s*(minutes?|mins?|min|hours?|hrs?|ghante?|minute)`, 'i'))
    || input.match(new RegExp(`${amountPattern}\\s*(minutes?|mins?|min|hours?|hrs?|ghante?|minute)\\s*(?:mein|me|baad|bad)`, 'i'));
  if (relative) {
    const amount = number(relative[1]);
    const unit = relative[2].toLowerCase();
    return new Date(now.getTime() + amount * (/hour|hr|ghant/.test(unit) ? 3_600_000 : 60_000));
  }
  // Prefer an explicit "at 5 PM" expression so digits in a target phone
  // number are never mistaken for the scheduled time. The fallback supports
  // commands that begin with a time, such as "/t 7:30 AM ...".
  const match = input.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)?\b/i)
    || input.match(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)\b/i);
  if (!match) return undefined;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const marker = match[3]?.toLowerCase();
  if (hour > 23 || minute > 59 || ((marker === 'am' || marker === 'pm') && hour > 12)) return undefined;
  if (marker === 'pm' && hour < 12) hour += 12;
  if (marker === 'am' && hour === 12) hour = 0;
  const dueAt = new Date(now);
  dueAt.setHours(hour, minute, 0, 0);
  const numericDate = input.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (numericDate) {
    const year = numericDate[3] ? Number(numericDate[3].length === 2 ? `20${numericDate[3]}` : numericDate[3]) : now.getFullYear();
    dueAt.setFullYear(year, Number(numericDate[2]) - 1, Number(numericDate[1]));
  } else if (/day after tomorrow|parso\b/i.test(input)) dueAt.setDate(dueAt.getDate() + 2);
  else if (/tomorrow|kal\b/i.test(input)) dueAt.setDate(dueAt.getDate() + 1);
  else {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekday = weekdays.findIndex(day => new RegExp(`\\b(?:next\\s+)?${day}\\b`, 'i').test(input));
    if (weekday >= 0) {
      let days = (weekday - dueAt.getDay() + 7) % 7;
      if (days === 0 || new RegExp(`\\bnext\\s+${weekdays[weekday]}\\b`, 'i').test(input)) days += 7;
      dueAt.setDate(dueAt.getDate() + days);
    } else if (dueAt <= now && !/aaj|today/i.test(input)) dueAt.setDate(dueAt.getDate() + 1);
  }
  return dueAt;
}

function selfMessageContent(input: string) {
  const quoted = input.match(/["“](.+?)["”]/)?.[1]?.trim();
  if (quoted) return quoted;
  const afterSaying = input.match(/\b(?:saying|bol(?:na|ke)?|likh(?:na|kar|ke)?)\s+(.+?)(?=\s+(?:in|after|\d+\s*(?:min|minute|hour)|$))/i)?.[1]?.trim();
  if (afterSaying) return afterSaying;
  const cleaned = input
    .replace(/^(?:please\s+)?(?:mujhe|mere\s+(?:number|whatsapp)(?:\s+(?:par|pe|pr))?|isi\s+(?:number|chat)(?:\s+(?:par|pe|pr))?|send\s+me)\s*/i, '')
    .replace(/^(?:ek|one|a)?\s*(?:message|msg|sandesh)\s*/i, '')
    .replace(/^(?:mujhe|mere\s+(?:number|whatsapp)(?:\s+(?:par|pe|pr))?|isi\s+(?:number|chat)(?:\s+(?:par|pe|pr))?)\s*/i, '')
    .replace(/(?:\d+|one|two|three|four|five|ek|do|teen|char|chaar|paanch)\s*(?:minutes?|mins?|min|hours?|hrs?|ghante?)\s*(?:mein|me|baad|bad)\b/ig, '')
    .replace(/\b(?:in|after)\s*(?:\d+|one|two|three|four|five|ek|do|teen|char|chaar|paanch)\s*(?:minutes?|mins?|min|hours?|hrs?|ghante?)\b/ig, '')
    .replace(/\b(?:bhej|send)\w*\s*(?:dena|do|karna|kar\s+dena)?\b/ig, '')
    .replace(/\s+\b(?:likh|bol)\s*(?:kar|ke|dena)?\s*$/i, '')
    .replace(/^(?:ki|that)\s+/i, '')
    .replace(/\s+/g, ' ').trim();
  return cleaned || '🔔 Aapka scheduled message.';
}

function flexibleSend(input: string, dueAt?: Date): ParsedTask | undefined {
  if (!dueAt || !/\b(?:send|bhej\w*|message|msg|sandesh)\b/i.test(input)) return undefined;
  const self = /\b(?:mujhe|me|myself|isi\s+number|is\s+number|same\s+number)\b/i.test(input);
  const phone = input.match(/(?:^|\s)(\+?\d{10,15})(?=\s|$)/)?.[1];
  const toTarget = input.match(/\b(?:to)\s+(.+?)(?=\s+(?:at|on|today|tomorrow|kal|aaj|next|saying|message|msg|send|in|after)\b|["“]|$)/i)?.[1];
  const koTarget = input.match(/^(.+?)\s+ko\b/i)?.[1]?.replace(/^(?:please\s+)?/i, '').trim();
  const bareSend = input.match(/^(?:please\s+)?send(?:\s+message)?(?:\s+to)?\s+(\S+)\s+(.+?)(?=\s+(?:at|on|today|tomorrow|kal|aaj|next|in|after)\b|$)/i);
  const contactName = phone || toTarget?.trim() || koTarget || bareSend?.[1];
  if (!self && !contactName) return undefined;

  const quoted = input.match(/["“](.+?)["”]/)?.[1];
  const saying = input.match(/\b(?:saying|bol(?:na|ke)?|likh(?:na|kar|ke)?|text)\s+(.+?)(?=\s+(?:at|on|today|tomorrow|kal|aaj|next|in|after)\b|$)/i)?.[1];
  const afterTime = input.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\s*(?:par|pe|pr)?\s+(.+?)\s+(?:bhej|send)\w*(?:\s+(?:dena|do|karna))?$/i)?.[1];
  let content = quoted || saying || bareSend?.[2] || afterTime;
  if (!content && phone) {
    content = input
      .replace(/^(?:please\s+)?(?:send\s+)?/i, '')
      .replace(phone, '')
      .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\b[\s\S]*$/i, '')
      .replace(/\b(?:today|tomorrow|kal|aaj|on|next)\b[\s\S]*$/i, '')
      .trim();
  }
  if (!content) content = '🔔 Aapka scheduled message.';
  const target = self ? 'This number' : contactName!;
  return { actionType: 'SEND_MESSAGE', title: `Message to ${target}`, contactName: target, messageContent: content.trim(), dueAt, count: 0, interval: 0, sendToCurrentChat: self };
}

export function parseReminder(text: string): ParsedTask {
  const input = text.replace(/^\/t\s*-?\s*/i, '').trim();
  const dueAt = parseDateTime(input);
  const countMatch = input.match(/(?:remind(?: me)?|reminder|bar)\s*(?:me\s*)?(\d+|one|two|three|four|five|ek|do|teen|char|chaar|paanch)/i) || input.match(/(\d+|do|teen)\s*bar/i);
  const intervalMatch = input.match(/(\d+)\s*(?:min|minute)/i);
  const selfRequested = /\b(?:mujhe|mere\s+(?:number|whatsapp)|isi\s+(?:number|chat)|is\s+(?:number|chat)|same\s+number|send\s+me|message\s+me)\b/i.test(input);
  if (selfRequested && dueAt && /\b(?:send|bhej\w*|message|msg|sandesh|likh\w*)\b/i.test(input)) {
    return { actionType: 'SEND_MESSAGE', title: 'Message to this number', contactName: 'This number', messageContent: selfMessageContent(input), dueAt, count: 0, interval: 0, sendToCurrentChat: true };
  }
  const simplePhoneFirst = input.match(/^(\+?\d{10,15})\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\s*(?:par|pe|pr|-)?\s*(.+)$/i);
  const simplePhoneLastTime = input.match(/^(?:send\s+)?(\+?\d{10,15})\s+(.+?)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)$/i);
  const simplePhone = simplePhoneFirst || simplePhoneLastTime;
  if (simplePhone) {
    return { actionType: 'SEND_MESSAGE', title: `Message to ${simplePhone[1]}`, contactName: simplePhone[1], messageContent: simplePhone[2].trim(), dueAt, count: 0, interval: 0 };
  }

  const hinglishTarget = input.match(/^(.+?)\s+ko\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\s*(?:par|pe|pr)?\s+["“]?(.+?)["”]?\s+(?:bhej|send)\w*(?:\s+(?:dena|do|karna))?$/i);
  if (hinglishTarget) {
    return { actionType: 'SEND_MESSAGE', title: `Message to ${hinglishTarget[1].trim()}`, contactName: hinglishTarget[1].trim(), messageContent: hinglishTarget[2].trim(), dueAt, count: 0, interval: 0 };
  }

  const sameChatMessage = /\bmujhe\b[\s\S]*\b(?:message|msg|sandesh)\b[\s\S]*\b(?:bhej|send)\w*[\s\S]*\b(?:isi|is)\s+number\s+(?:par|pe|pr)\b/i.test(input)
    || /\b(?:send|bhej)\w*[\s\S]*\b(?:isi|is)\s+number\s+(?:par|pe|pr)\b/i.test(input);
  if (sameChatMessage) {
    const quoted = input.match(/["“](.+?)["”]/);
    const saying = input.match(/(?:saying|message\s+(?:hai|is)|likh(?:kar|ke)?)\s+(.+?)\s+(?:bhej|send)/i);
    return {
      actionType: 'SEND_MESSAGE',
      title: 'Message to this number',
      contactName: 'This number',
      messageContent: quoted?.[1]?.trim() || saying?.[1]?.trim() || '🔔 Aapka scheduled message.',
      dueAt,
      count: 0,
      interval: 0,
      sendToCurrentChat: true,
    };
  }
  const simpleSelf = input.match(/^(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\s*(?:par|pe|pr|-)?\s*(.+)$/i);
  if (simpleSelf && !/^(?:remind|yaad\s+dila)/i.test(simpleSelf[1])) {
    return { actionType: 'SEND_MESSAGE', title: 'Message to this number', contactName: 'This number', messageContent: simpleSelf[1].trim(), dueAt, count: 0, interval: 0, sendToCurrentChat: true };
  }
  const send = input.match(/^send(?:\s+message)?\s+to\s+(.+?)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?\s+(?:saying\s+)?(.+)$/i)
    || input.match(/^send\s+(.+?)\s+["“](.+?)["”]\s+(?:tomorrow|today|kal|aaj)?\s*at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?$/i)
    || input.match(/^send(?:\s+message)?(?:\s+to)?\s+(.+?)\s+(.+?)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)$/i);
  if (send) {
    const contactName = send[1].trim();
    const messageContent = send[2].trim();
    return { actionType: 'SEND_MESSAGE', title: `Message to ${contactName}`, contactName, messageContent, dueAt, count: 0, interval: 0 };
  }
  const flexible = flexibleSend(input, dueAt); if (flexible) return flexible;
  const title = input
    .replace(/\b(?:in|after)\s+\d+\s*(?:minutes?|mins?|hours?|hrs?)\b/ig, '')
    .replace(/\b\d+\s*(?:minutes?|mins?|hours?|hrs?|minute|ghante?)\s*(?:mein|me|baad)\b/ig, '')
    .replace(/(?:today|aaj|tomorrow|kal|parso|day after tomorrow)\b.*$/i, '')
    .replace(/\b(?:on\s+)?\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/ig, '')
    .replace(/\b(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/ig, '')
    .replace(/(?:\bat\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?\b|(?:^|\s)\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\b).*$/i, '')
    .replace(/^(?:please\s+)?(?:mujhe\s*)?(?:remind\s+me\s+(?:to\s+)?|remind\s+(?:to\s+)?|yaad\s+dila(?:na)?\s+(?:ki\s+)?)/i, '')
    .replace(/\s+(?:yaad\s+dila\w*(?:\s+dena)?|remind\s+kar\w*)\s*$/i, '')
    .replace(/\s+on\s*$/i, '')
    .trim();
  return { actionType: 'REMINDER', title: title || undefined, dueAt, count: number(countMatch?.[1]), interval: Number(intervalMatch?.[1] || 10) };
}

async function nextTaskId(instanceId: string) {
  const last = await Reminder.findOne({ instanceId }).sort({ taskId: -1 }).lean();
  return (last?.taskId || 0) + 1;
}

async function findContacts(instanceId: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Contact.find({ instanceId, $or: [{ name: new RegExp(escaped, 'i') }, { pushName: new RegExp(escaped, 'i') }] }).limit(10);
}

function isDuplicateSourceMessage(error: unknown) {
  const value = error as { code?: number; keyPattern?: Record<string, number> };
  return value?.code === 11000 && Boolean(value.keyPattern?.sourceMessageId);
}

async function createSendMessage(instanceId: string, chatId: string, parsed: ParsedTask, contact: IContact, sourceMessageId?: string) {
  const taskId = await nextTaskId(instanceId);
  try {
    const task = await Reminder.create({ instanceId, chatId, taskId, sourceMessageId, actionType: 'SEND_MESSAGE', title: parsed.title,
      dueAt: parsed.dueAt, timezone: TIMEZONE, createdBy: chatId, contactName: contact.name || contact.pushName || parsed.contactName,
      contactPhone: contact.phone, contactId: contact.isNew ? contact.jid : contact._id.toString(), contactJid: contact.jid, messageContent: parsed.messageContent,
      deliveryStatus: 'pending', nextDeliveryAttempt: parsed.dueAt, history: [{ type: 'created', message: 'Scheduled message created from WhatsApp' }] });
    return { reply: '✅ Done.', created: true };
  } catch (error) {
    if (isDuplicateSourceMessage(error)) return { reply: '', silent: true };
    throw error;
  }
}

function directPhoneContact(instanceId: string, rawTarget: string) {
  const phone = normalizeTaskPhone(rawTarget);
  if (!phone) return undefined;
  return new Contact({ instanceId, jid: phone.jid, phone: phone.display, name: phone.display });
}

export async function createReminderFromMessage(instanceId: string, chatId: string, text: string, sourceMessageId?: string) {
  const parsed = parseReminder(text);
  if (!parsed.title || !parsed.dueAt) return { reply: 'Please add a time. Try:\n/t 7:45 AM good morning\n/t 9505214113 8 PM hello\n/t call Rahul tomorrow at 5 PM' };
  if (parsed.actionType === 'SEND_MESSAGE') {
    if (parsed.sendToCurrentChat) {
      const chatPhone = chatId.split('@')[0].replace(/\D/g, '');
      const currentChat = new Contact({ instanceId, jid: chatId, phone: chatPhone || 'current-chat', name: 'This number' });
      return createSendMessage(instanceId, chatId, parsed, currentChat, sourceMessageId);
    }
    const directContact = directPhoneContact(instanceId, parsed.contactName!);
    if (directContact) return createSendMessage(instanceId, chatId, parsed, directContact, sourceMessageId);
    const contacts = await findContacts(instanceId, parsed.contactName!);
    if (contacts.length === 1) return createSendMessage(instanceId, chatId, parsed, contacts[0], sourceMessageId);
    pendingContacts.set(pendingKey(instanceId, chatId), { instanceId, chatId, parsed, contacts, sourceMessageId });
    if (!contacts.length) return { reply: `I couldn't find “${parsed.contactName}” in your contacts. Reply /t-contact followed by the WhatsApp number.` };
    const options = contacts.map((c, i) => `${i + 1}. ${c.name || c.pushName || 'Unnamed'} — ******${c.phone.slice(-4)}`).join('\n');
    return { reply: `I found multiple matching contacts:\n${options}\n\nReply /t-contact 1` };
  }
  const taskId = await nextTaskId(instanceId);
  const reminderTimes = Array.from({ length: parsed.count }, (_, i) => new Date(parsed.dueAt!.getTime() - parsed.interval * (parsed.count - i) * 60000));
  try {
    const reminder = await Reminder.create({ instanceId, chatId, taskId, sourceMessageId, actionType: 'REMINDER', title: parsed.title, dueAt: parsed.dueAt,
      timezone: TIMEZONE, createdBy: chatId, reminderCount: parsed.count, reminderIntervalMinutes: parsed.interval,
      reminderTimes, nextReminderScheduled: reminderTimes[0], history: [{ type: 'created', message: 'Created from WhatsApp /t command' }] });
    return { reply: '✅ Done.', created: true };
  } catch (error) {
    if (isDuplicateSourceMessage(error)) return { reply: '', silent: true };
    throw error;
  }
}

async function resolvePendingContact(instanceId: string, chatId: string, value: string, sourceMessageId?: string) {
  const key = pendingKey(instanceId, chatId); const pending = pendingContacts.get(key);
  if (!pending) return { reply: 'There is no pending contact selection.' };
  let contact: IContact | undefined;
  if (/^\d+$/.test(value) && Number(value) <= pending.contacts.length) contact = pending.contacts[Number(value) - 1];
  else if (/^\+?\d{8,15}$/.test(value)) {
    const phone = normalizeTaskPhone(value);
    if (phone) contact = new Contact({ instanceId, jid: phone.jid, phone: phone.display, name: pending.parsed.contactName });
  }
  if (!contact) return { reply: 'Please reply with a valid option number or WhatsApp number.' };
  pendingContacts.delete(key);
  return createSendMessage(instanceId, chatId, pending.parsed, contact, sourceMessageId || pending.sourceMessageId);
}

export async function handleReminderCommand(instanceId: string, chatId: string, text: string, sourceMessageId?: string) {
  const selection = text.match(/^\/t-contact\s+(.+)$/i); if (selection) return resolvePendingContact(instanceId, chatId, selection[1].trim(), sourceMessageId);
  if (/^\/t(?:\s+(?:help|examples?))?\s*$/i.test(text)) return { reply: 'Quick task examples:\n/t 7:45 AM good morning\n/t 9505214113 8 PM hello\n/t send Rahul hello at 6 PM\n/t call Rahul tomorrow at 5 PM\n/t help' };
  if (/^\/t\s*-?/i.test(text)) return createReminderFromMessage(instanceId, chatId, text, sourceMessageId);
  const match = text.match(/^\/t-(\d+)\s+(.+)$/i); if (!match) return null;
  const reminder = await Reminder.findOne({ instanceId, chatId, taskId: Number(match[1]) });
  if (!reminder) return { reply: `I could not find Task #${match[1]}.` };
  if (['sent', 'delivered', 'read'].includes(reminder.deliveryStatus)) return { reply: `Task #${reminder.taskId} has already been sent and can no longer be edited.` };
  const command = match[2].trim();
  if (/^cancel$/i.test(command)) { reminder.status = 'cancelled'; reminder.deliveryStatus = reminder.actionType === 'SEND_MESSAGE' ? 'cancelled' : 'not_applicable'; reminder.nextDeliveryAttempt = undefined; reminder.nextReminderScheduled = undefined; reminder.history.push({ type: 'cancelled', message: 'Cancelled via WhatsApp' }); await reminder.save(); return { reply: `🗑️ Task #${reminder.taskId} has been cancelled. The message will not be sent.` }; }
  const time = command.match(/^time\s+(.+)$/i);
  if (time) { const dueAt = parseDateTime(time[1]); if (!dueAt) return { reply: 'Please send a valid time, for example /t-12 time 6:30 PM.' }; reminder.dueAt = dueAt; if (reminder.actionType === 'SEND_MESSAGE') { reminder.nextDeliveryAttempt = dueAt; reminder.deliveryStatus = 'pending'; reminder.retryCount = 0; } reminder.history.push({ type: 'rescheduled', message: `Rescheduled to ${dueAt.toISOString()}` }); await reminder.save(); return { reply: `✅ Task #${reminder.taskId} has been rescheduled to ${dueAt.toLocaleTimeString()}.` }; }
  const message = command.match(/^message\s+(.+)$/i);
  if (message && reminder.actionType === 'SEND_MESSAGE') { reminder.messageContent = message[1].trim(); reminder.history.push({ type: 'edited', message: 'Message content updated via WhatsApp' }); await reminder.save(); return { reply: `✅ Message for Task #${reminder.taskId} has been updated.` }; }
  const contact = command.match(/^contact\s+(.+)$/i);
  if (contact && reminder.actionType === 'SEND_MESSAGE') { const matches = await findContacts(instanceId, contact[1]); if (matches.length !== 1) return { reply: matches.length ? `I found ${matches.length} matching contacts. Please use the dashboard to choose one.` : `I couldn't find “${contact[1]}” in your contacts.` }; reminder.contactName = matches[0].name || matches[0].pushName || contact[1]; reminder.contactPhone = matches[0].phone; reminder.contactId = matches[0]._id.toString(); reminder.contactJid = matches[0].jid; reminder.history.push({ type: 'edited', message: 'Contact updated via WhatsApp' }); await reminder.save(); return { reply: `✅ Contact for Task #${reminder.taskId} has been updated to ${reminder.contactName}.` }; }
  if (/^completed$/i.test(command)) { reminder.status = 'completed'; reminder.nextReminderScheduled = undefined; await reminder.save(); return { reply: `✅ Great! Task #${reminder.taskId} has been marked as completed.` }; }
  if (/^working$/i.test(command)) { reminder.status = 'in_progress'; await reminder.save(); return { reply: `🔄 Task #${reminder.taskId} is now marked as In Progress.` }; }
  const remind = command.match(/^remind\s+(\d+)/i); if (remind) { reminder.nextReminderScheduled = new Date(Date.now() + Number(remind[1]) * 60000); reminder.reminderTimes.push(reminder.nextReminderScheduled); await reminder.save(); return { reply: `🔔 Task #${reminder.taskId} will be reminded again in ${remind[1]} minutes.` }; }
  return { reply: 'Unknown task command. Try time, message, contact, cancel, completed, or working.' };
}

export async function processDueReminders() {
  const now = new Date();
  // Recover tasks created before Indian 10-digit normalization was added.
  // Baileys may accept an incomplete JID without WhatsApp ever delivering it.
  const incomplete = await Reminder.find({
    actionType: 'SEND_MESSAGE',
    deliveryStatus: 'sent',
    contactPhone: /^\+?[6-9]\d{9}$/,
  });
  for (const task of incomplete) {
    const phone = normalizeTaskPhone(task.contactPhone || '');
    if (!phone || task.contactJid === phone.jid) continue;
    await Reminder.findOneAndUpdate(
      { _id: task._id, deliveryStatus: 'sent', contactJid: { $ne: phone.jid } },
      {
        $set: { contactPhone: phone.display, contactJid: phone.jid, deliveryStatus: 'pending', status: 'in_progress', nextDeliveryAttempt: now, retryCount: 0 },
        $unset: { deliveredAt: 1, whatsappMessageId: 1 },
        $push: { history: { at: now, type: 'recovered', message: 'Added +91 to incomplete Indian destination and queued delivery again' } },
      }
    );
  }

  const messages = await Reminder.find({ actionType: 'SEND_MESSAGE', status: { $in: ['todo', 'in_progress'] }, deliveryStatus: { $in: ['pending', 'retry_pending'] }, nextDeliveryAttempt: { $lte: now } });
  for (const candidate of messages) {
    const task = await Reminder.findOneAndUpdate({ _id: candidate._id, deliveryStatus: { $in: ['pending', 'retry_pending'] } }, { $set: { deliveryStatus: 'sending', status: 'in_progress', lastDeliveryAttempt: now } }, { new: true });
    if (!task) continue;
    try {
      const sock = getSocket(task.instanceId); if (!sock) throw new Error('WhatsApp is not connected');
      const destination = deliveryJid(task.contactJid, task.contactPhone);
      if (!destination) throw new Error('Invalid WhatsApp destination');
      task.contactJid = destination;
      const normalizedPhone = normalizeTaskPhone(task.contactPhone || destination);
      if (normalizedPhone && !destination.endsWith('@lid')) task.contactPhone = normalizedPhone.display;
      const result = await sock.sendMessage(destination, { text: task.messageContent! });
      task.deliveryStatus = 'sent'; task.status = 'completed'; task.nextDeliveryAttempt = undefined;
      task.whatsappMessageId = result?.key?.id || undefined; task.failureReason = undefined;
      task.history.push({ type: 'sent', message: `Scheduled WhatsApp message accepted for ${destination}` }); await task.save();
    } catch (error) {
      task.retryCount += 1; task.failureReason = error instanceof Error ? error.message : 'Unknown delivery error';
      if (task.retryCount >= MAX_RETRIES) { task.deliveryStatus = 'failed'; task.status = 'completed'; task.nextDeliveryAttempt = undefined; }
      else { task.deliveryStatus = 'retry_pending'; task.status = 'in_progress'; task.nextDeliveryAttempt = new Date(Date.now() + task.retryCount * 60_000); }
      task.history.push({ type: 'delivery_failed', message: task.failureReason }); await task.save();
    }
  }

  const due = await Reminder.find({ actionType: 'REMINDER', status: { $nin: ['completed', 'cancelled'] }, nextReminderScheduled: { $lte: now } });
  for (const reminder of due) {
    const sock = getSocket(reminder.instanceId); if (!sock) continue;
    const isFinal = reminder.remindersSent + 1 >= reminder.reminderCount;
    await sock.sendMessage(reminder.chatId, { text: isFinal ? `🔔 Reminder: ${reminder.title} is due soon.` : `🔔 Reminder: You have a task due at ${reminder.dueAt.toLocaleTimeString()} — ${reminder.title}.` });
    reminder.remindersSent += 1; reminder.lastReminderSent = now; reminder.nextReminderScheduled = reminder.reminderTimes[reminder.remindersSent];
    if (!reminder.nextReminderScheduled && now >= reminder.dueAt) await sock.sendMessage(reminder.chatId, { text: `⏰ Task #${reminder.taskId} is due. Reply /t-${reminder.taskId} completed or /t-${reminder.taskId} working.` });
    reminder.history.push({ type: 'sent', message: 'WhatsApp reminder sent' }); await reminder.save();
  }
}

export async function listTasks(instanceId: string, query: Record<string, unknown> = {}) {
  const { page, limit, skip } = parsePagination(query);
  const [data, total] = await Promise.all([Reminder.find({ instanceId }).sort({ dueAt: 1 }).skip(skip).limit(limit).lean(), Reminder.countDocuments({ instanceId })]);
  return buildPaginatedResult(data, total, { page, limit, skip });
}

export async function updateTask(instanceId: string, taskId: number, changes: Record<string, unknown>) {
  const task = await Reminder.findOne({ instanceId, taskId }); if (!task) return null;
  if (['sent', 'delivered', 'read'].includes(task.deliveryStatus)) throw new Error('Sent messages cannot be edited');
  for (const field of ['title', 'messageContent', 'contactName', 'contactPhone', 'contactId', 'contactJid', 'timezone', 'status'] as const) if (changes[field] !== undefined) (task as any)[field] = changes[field];
  if (changes.contactPhone && !changes.contactJid) {
    const phone = normalizeTaskPhone(String(changes.contactPhone));
    if (!phone) throw new Error('Invalid WhatsApp number');
    task.contactPhone = phone.display; task.contactJid = phone.jid; task.contactId = undefined;
  }
  if (changes.dueAt) { const dueAt = new Date(String(changes.dueAt)); if (Number.isNaN(dueAt.getTime())) throw new Error('Invalid scheduled date'); task.dueAt = dueAt; if (task.actionType === 'SEND_MESSAGE') { task.nextDeliveryAttempt = dueAt; task.deliveryStatus = 'pending'; task.retryCount = 0; } }
  task.history.push({ type: 'edited', message: 'Task updated from dashboard' }); return task.save();
}

export async function cancelTask(instanceId: string, taskId: number) { return Reminder.findOneAndUpdate({ instanceId, taskId, deliveryStatus: { $nin: ['sent', 'delivered', 'read'] } }, { $set: { status: 'cancelled', deliveryStatus: 'cancelled' }, $unset: { nextDeliveryAttempt: 1, nextReminderScheduled: 1 }, $push: { history: { at: new Date(), type: 'cancelled', message: 'Cancelled from dashboard' } } }, { new: true }); }
