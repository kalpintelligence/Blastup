import { getSocket } from './whatsapp.service';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { WhatsAppInstance } from '../models/WhatsAppInstance';
import Boom from '@hapi/boom';
import fs from 'fs';
import path from 'path';

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

function normalizeJid(to: string): string {
  const cleaned = to.replace(/[^0-9]/g, '');
  return cleaned.includes('@') ? to : `${cleaned}@s.whatsapp.net`;
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
