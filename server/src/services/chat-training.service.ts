import crypto from 'crypto';
import { AITrainingMessage } from '../models/AITrainingMessage';

export async function importWhatsAppExport(instanceId: string, ownerName: string, contents: string, chatName?: string) {
  const lines = contents.replace(/^\uFEFF/, '').split(/\r?\n/);
  const entries: Array<{ sender: string; text: string; timestamp?: Date }> = [];
  const android = /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–)\s*([^:]+):\s*(.*)$/i;
  const ios = /^\[(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\]\s*([^:]+):\s*(.*)$/i;
  for (const line of lines) {
    const match = line.match(android) || line.match(ios);
    if (match) entries.push({ sender: match[3].trim(), text: match[4].trim(), timestamp: new Date(`${match[1]} ${match[2]}`) });
    else if (entries.length && line.trim()) entries[entries.length - 1].text += `\n${line.trim()}`;
  }
  const owner = ownerName.trim().toLocaleLowerCase();
  const operations = entries.filter(entry => entry.text && !/<Media omitted>|message was deleted|security code changed/i.test(entry.text)).map((entry, index) => {
    const sourceHash = crypto.createHash('sha256').update(`${chatName || ''}|${entry.sender}|${entry.text}|${entry.timestamp?.getTime() || index}`).digest('hex');
    return { updateOne: { filter: { instanceId, sourceHash }, update: { $setOnInsert: { instanceId, sourceHash, chatName: chatName || 'WhatsApp export', sender: entry.sender, text: entry.text.slice(0, 4000), fromMe: entry.sender.toLocaleLowerCase() === owner, timestamp: Number.isNaN(entry.timestamp?.getTime()) ? undefined : entry.timestamp } }, upsert: true } };
  });
  if (operations.length) await AITrainingMessage.bulkWrite(operations, { ordered: false });
  return { imported: operations.length, yourMessages: operations.filter(operation => operation.updateOne.update.$setOnInsert.fromMe).length };
}
