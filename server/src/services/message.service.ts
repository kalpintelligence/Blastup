import { getSocket } from './whatsapp.service';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { WhatsAppInstance } from '../models/WhatsAppInstance';
import Boom from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { normalizeJid } from '../utils/jid';

/** Download a URL into a Buffer (follows redirects) */
async function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}
export interface SendTextParams {
  to: string;
  text: string;
}

export interface SendMediaParams {
  to: string;
  caption?: string;
  filePath: string;
  mimetype: string;
  filename?: string;
}

async function getConnectedSocket(instanceId: string) {
  const sock = getSocket(instanceId);
  if (!sock) throw Boom.serverUnavailable('WhatsApp is not connected for this account');
  return sock;
}

export async function sendText(instanceId: string, params: SendTextParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  const result = await sock.sendMessage(jid, { text: params.text });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'text',
    text: params.text,
  });

  return result;
}

export async function sendImage(instanceId: string, params: SendMediaParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  const buffer = fs.readFileSync(params.filePath);
  const result = await sock.sendMessage(jid, {
    image: buffer,
    caption: params.caption,
    mimetype: params.mimetype,
  });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'image',
    caption: params.caption,
    mediaUrl: params.filePath,
    mediaMimeType: params.mimetype,
  });

  return result;
}

/** Send an image from a public URL — used by campaigns */
export async function sendImageFromUrl(
  instanceId: string,
  params: { to: string; url: string; caption?: string }
) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  const buffer = await fetchBuffer(params.url);
  // Determine mimetype from URL extension
  const ext = params.url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const mimetype = mimeMap[ext] || 'image/jpeg';

  const result = await sock.sendMessage(jid, {
    image: buffer,
    caption: params.caption,
    mimetype,
  });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'image',
    caption: params.caption,
    mediaUrl: params.url,
    mediaMimeType: mimetype,
  });

  return result;
}

export async function sendVideo(instanceId: string, params: SendMediaParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  const buffer = fs.readFileSync(params.filePath);
  const result = await sock.sendMessage(jid, {
    video: buffer,
    caption: params.caption,
    mimetype: params.mimetype,
  });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'video',
    caption: params.caption,
    mediaUrl: params.filePath,
    mediaMimeType: params.mimetype,
  });

  return result;
}

export async function sendAudio(instanceId: string, params: SendMediaParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  const buffer = fs.readFileSync(params.filePath);
  const result = await sock.sendMessage(jid, {
    audio: buffer,
    mimetype: params.mimetype,
    ptt: false,
  });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'audio',
    mediaUrl: params.filePath,
    mediaMimeType: params.mimetype,
  });

  return result;
}

export async function sendDocument(instanceId: string, params: SendMediaParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  const buffer = fs.readFileSync(params.filePath);
  const result = await sock.sendMessage(jid, {
    document: buffer,
    caption: params.caption,
    mimetype: params.mimetype,
    fileName: params.filename || path.basename(params.filePath),
  });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'document',
    caption: params.caption,
    mediaUrl: params.filePath,
    mediaMimeType: params.mimetype,
    mediaFileName: params.filename || path.basename(params.filePath),
  });

  return result;
}

export interface SendButtonParams {
  to: string;
  text: string;
  footer?: string;
  buttons: Array<{
    type: 'reply' | 'url' | 'call';
    displayText: string;
    idOrUrl?: string;
  }>;
}

export interface SendSliderParams {
  to: string;
  title: string;
  text: string;
  footer?: string;
  items: Array<{
    title: string;
    description?: string;
    imageUrl?: string;
    price?: string;
    buttonText?: string;
    buttonId?: string;
  }>;
}

export async function sendButton(instanceId: string, params: SendButtonParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  // Construct Baileys Interactive / Formatted Button Message payload
  const formattedButtonsText = params.buttons
    .map((b, i) => `\n[ ${i + 1}. ${b.displayText}${b.type === 'url' ? ` -> ${b.idOrUrl || ''}` : ''} ]`)
    .join('');

  const fullText = `${params.text}${formattedButtonsText}${params.footer ? `\n\n_${params.footer}_` : ''}`;

  const messagePayload: any = {
    text: fullText,
  };

  // Baileys raw template buttons support if available
  if (params.buttons.length > 0) {
    messagePayload.templateButtons = params.buttons.map((b, index) => {
      if (b.type === 'url') {
        return {
          index: index + 1,
          urlButton: { displayText: b.displayText, url: b.idOrUrl || '' },
        };
      }
      if (b.type === 'call') {
        return {
          index: index + 1,
          callButton: { displayText: b.displayText, phoneNumber: b.idOrUrl || '' },
        };
      }
      return {
        index: index + 1,
        quickReplyButton: { displayText: b.displayText, id: b.idOrUrl || `btn_${index + 1}` },
      };
    });
    if (params.footer) messagePayload.footer = params.footer;
  }

  const result = await sock.sendMessage(jid, messagePayload);

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'button',
    text: fullText,
  });

  return result;
}

export async function sendSlider(instanceId: string, params: SendSliderParams) {
  const sock = await getConnectedSocket(instanceId);
  const jid = normalizeJid(params.to);

  // Construct structured multi-card carousel formatted text / template payload
  const itemsText = params.items
    .map((item, idx) => {
      let itemStr = `\n🛍️ *Item ${idx + 1}: ${item.title}*`;
      if (item.price) itemStr += ` — *${item.price}*`;
      if (item.description) itemStr += `\n${item.description}`;
      if (item.imageUrl) itemStr += `\nImage: ${item.imageUrl}`;
      if (item.buttonText) itemStr += `\n👉 [ ${item.buttonText} ]`;
      return itemStr;
    })
    .join('\n-------------------');

  const fullContent = `🛒 *${params.title}*\n${params.text}\n${itemsText}${params.footer ? `\n\n_${params.footer}_` : ''}`;

  const result = await sock.sendMessage(jid, { text: fullContent });

  await persistOutgoingMessage(instanceId, {
    msgId: result!.key.id!,
    chatId: jid,
    type: 'slider',
    text: fullContent,
  });

  return result;
}

async function persistOutgoingMessage(instanceId: string, data: {
  msgId: string;
  chatId: string;
  type: string;
  text?: string;
  caption?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
}) {
  const sock = getSocket(instanceId);
  const now = new Date();

  await Message.create({
    msgId: data.msgId,
    chatId: data.chatId,
    instanceId,
    from: sock?.user?.id || '',
    to: data.chatId,
    fromMe: true,
    type: data.type,
    text: data.text || null,
    caption: data.caption || null,
    mediaUrl: data.mediaUrl || null,
    mediaMimeType: data.mediaMimeType || null,
    mediaFileName: data.mediaFileName || null,
    status: 'sent',
    timestamp: now,
  });

  await Chat.findOneAndUpdate(
    { chatId: data.chatId, instanceId },
    {
      $set: {
        lastMessage: {
          content: data.text || data.caption || `[${data.type}]`,
          timestamp: now,
          fromMe: true,
          type: data.type,
        },
      },
    },
    { upsert: true }
  );

  await WhatsAppInstance.findOneAndUpdate(
    { instanceId },
    { $inc: { messagesSent: 1, messagesToday: 1 } }
  );
}
