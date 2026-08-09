import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { WhatsAppInstance } from '../models/WhatsAppInstance';
import { Chat } from '../models/Chat';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { EventEmitter } from 'events';
import pino from 'pino';
import { normalizeJid } from '../utils/jid';
import { getSafeModeManager } from '../config/safemode';
import { wrapBaileysSocket } from '../safemode/wrapBaileysSocket';
import { recordKnownChatsFromStore } from '../safemode/recordKnownChatsFromStore';
import { SafeModeError } from '../safemode/SafeModeError';

export const waEvents = new EventEmitter();
waEvents.setMaxListeners(100);

const pinoLogger = pino({ level: 'silent' });

// Multi-tenant instance maps
const sockets = new Map<string, WASocket>();
const connectingStates = new Map<string, boolean>();
const manualDisconnects = new Map<string, boolean>();
const reconnectTimers = new Map<string, NodeJS.Timeout>();
const reconnectAttempts = new Map<string, number>();
const MAX_RECONNECT_ATTEMPTS = 5;

export async function initWhatsApp(instanceId: string = 'default'): Promise<void> {
  if (connectingStates.get(instanceId)) {
    return;
  }

  connectingStates.set(instanceId, true);

  try {
    const sessionDir = path.join(process.cwd(), env.SESSION_DIR, instanceId);
    fs.mkdirSync(sessionDir, { recursive: true });

    await WhatsAppInstance.findOneAndUpdate(
      { instanceId },
      {
        instanceId,
        sessionPath: sessionDir,
        status: 'connecting',
      },
      { upsert: true, new: true }
    );

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pinoLogger as any,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pinoLogger as any),
      },
      printQRInTerminal: false,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false,
      // WhatsApp is currently rejecting fresh QR sessions advertised as Desktop clients.
      // Using a regular web browser profile restores QR emission reliably.
      browser: Browsers.ubuntu('Chrome'),
      retryRequestDelayMs: 200,
      defaultQueryTimeoutMs: 60000,
      getMessage: async (key) => {
        const msg = await Message.findOne({ msgId: key.id!, instanceId });
        return msg?.rawMessage as proto.IMessage | undefined;
      },
    });

    sockets.set(instanceId, sock);

    // ── Event Handlers ──────────────────────────────────────────────

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        reconnectAttempts.set(instanceId, 0);

        const qrBase64 = await QRCode.toDataURL(qr);
        await WhatsAppInstance.findOneAndUpdate(
          { instanceId },
          {
            status: 'qr_ready',
            qrCode: qrBase64,
            qrExpiresAt: new Date(Date.now() + 60000),
          }
        );
        waEvents.emit(`qr:${instanceId}`, qrBase64);
      }

      if (connection === 'open') {
        connectingStates.set(instanceId, false);
        reconnectAttempts.set(instanceId, 0);
        const timer = reconnectTimers.get(instanceId);
        if (timer) {
          clearTimeout(timer);
          reconnectTimers.delete(instanceId);
        }

        const info = sock?.user;
        let profilePicUrl: string | null = null;
        try {
          if (sock && info?.id) {
            const url = await sock.profilePictureUrl(info.id, 'image');
            profilePicUrl = url || null;
          }
        } catch {
          // ignore
        }

        // ── Safe Mode wiring ─────────────────────────────────────────────
        // 1. Seed known chats so existing numbers aren't penalised as new
        const manager = getSafeModeManager();
        await recordKnownChatsFromStore(sock, manager, instanceId);

        // 2. Enable Safe Mode for new sessions if not already set
        const instance = await WhatsAppInstance.findOne({ instanceId });
        if (instance?.safeModeEnabled && !await manager.getStatus(instanceId).then(s => s.enabled)) {
          await manager.enable(instanceId, (instance.safeModeStartTier || 1) as any);
          logger.info(`[${instanceId}] Safe Mode enabled at Tier ${instance.safeModeStartTier || 1}`);
        }

        // 3. Wrap the socket — from this point ALL sendMessage calls go
        //    through Safe Mode. Store the *wrapped* socket so getSocket()
        //    returns a protected socket to every consumer.
        const wrappedSock = wrapBaileysSocket(sock, manager, instanceId);
        sockets.set(instanceId, wrappedSock);
        // ─────────────────────────────────────────────────────────────────

        await WhatsAppInstance.findOneAndUpdate(
          { instanceId },
          {
            status: 'connected',
            phone: info?.id?.split(':')[0] || null,
            pushName: info?.name || null,
            profilePicUrl,
            qrCode: null,
            qrExpiresAt: null,
            lastConnectedAt: new Date(),
          }
        );
        waEvents.emit(`connected:${instanceId}`, info);
      }

      if (connection === 'close') {
        connectingStates.set(instanceId, false);
        sockets.delete(instanceId);

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isManual = manualDisconnects.get(instanceId) || false;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isQrCycle = !isManual && !isLoggedOut;

        // Only mark truly disconnected for manual logouts
        if (isManual || isLoggedOut) {
          await WhatsAppInstance.findOneAndUpdate(
            { instanceId },
            { status: 'disconnected', lastDisconnectedAt: new Date() }
          );
        }

        // Invalidated creds (logged out from the phone, expired link, etc.)
        // must not survive on disk — the next connect attempt would just
        // reuse them and silently die again with no QR.
        if (isLoggedOut) {
          const sessionDir = path.join(process.cwd(), env.SESSION_DIR, instanceId);
          if (fs.existsSync(sessionDir)) {
            try {
              fs.rmSync(sessionDir, { recursive: true, force: true });
            } catch {}
          }
        }

        waEvents.emit(`disconnected:${instanceId}`, { statusCode, shouldReconnect: isQrCycle });

        // Always reset manual flag after consuming it
        manualDisconnects.set(instanceId, false);

        if (isQrCycle) {
          const attempts = (reconnectAttempts.get(instanceId) || 0) + 1;
          reconnectAttempts.set(instanceId, attempts);
          if (attempts <= MAX_RECONNECT_ATTEMPTS) {
            scheduleReconnect(instanceId, 2000);
          }
        }
      }
    });

    // Sync chats & contacts from history
    (sock.ev as any).on('messaging-history.set', async (data: any) => {
      try {
        const chats: any[] = data?.chats ?? [];
        const contacts: any[] = data?.contacts ?? [];

        if (chats.length > 0) {
          const chatOps = chats.map((chat: any) => {
            const normalizedChatId = normalizeJid(chat.id);
            return {
              updateOne: {
                filter: { chatId: normalizedChatId, instanceId },
                update: {
                  $set: {
                    name: chat.name ?? null,
                    unreadCount: chat.unreadCount ?? 0,
                    isArchived: chat.archived ?? false,
                    isPinned: !!chat.pinned,
                    instanceId,
                  },
                },
                upsert: true,
              },
            };
          });
          await Chat.bulkWrite(chatOps, { ordered: false });
          await WhatsAppInstance.findOneAndUpdate(
            { instanceId },
            { totalChats: chats.length, lastSyncAt: new Date() }
          );
        }

        if (contacts.length > 0) {
          const contactOps = contacts.map((c: any) => {
            const normalizedJid = normalizeJid(c.id);
            const phone = normalizedJid.split('@')[0];
            return {
              updateOne: {
                filter: { jid: normalizedJid, instanceId },
                update: {
                  $set: {
                    phone,
                    name: c.name ?? null,
                    pushName: c.notify ?? null,
                    instanceId,
                  },
                },
                upsert: true,
              },
            };
          });
          await Contact.bulkWrite(contactOps, { ordered: false });
          await WhatsAppInstance.findOneAndUpdate(
            { instanceId },
            { totalContacts: contacts.length }
          );
        }
      } catch (err) {
        logger.error(`[${instanceId}] Error syncing history`, { err });
      }
    });

    // Contacts upsert
    sock.ev.on('contacts.upsert', async (contacts) => {
      try {
        const ops = contacts.map((c: any) => {
          const normalizedJid = normalizeJid(c.id);
          const phone = normalizedJid.split('@')[0];
          return {
            updateOne: {
              filter: { jid: normalizedJid, instanceId },
              update: {
                $set: {
                  phone,
                  name: c.name ?? null,
                  pushName: c.notify ?? null,
                  instanceId,
                },
              },
              upsert: true,
            },
          };
        });
        if (ops.length > 0) await Contact.bulkWrite(ops, { ordered: false });
      } catch (err) {
        logger.error(`[${instanceId}] Error upserting contacts`, { err });
      }
    });

    // Incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        try {
          await processIncomingMessage(instanceId, msg, sock);
        } catch (err) {
          logger.error(`[${instanceId}] Error processing message`, { err, msgId: msg.key.id });
        }
      }
    });

    // Message status updates
    sock.ev.on('message-receipt.update', async (receipts) => {
      for (const receipt of receipts) {
        const status = receipt.receipt.userJid ? 'read' : 'delivered';
        await Message.findOneAndUpdate(
          { msgId: receipt.key.id, instanceId },
          { status }
        );
      }
    });

  } catch (err) {
    connectingStates.set(instanceId, false);
    await WhatsAppInstance.findOneAndUpdate(
      { instanceId },
      { status: 'error' }
    );
  }
}

async function processIncomingMessage(instanceId: string, msg: proto.IWebMessageInfo, sock: WASocket): Promise<void> {
  if (!msg.key.remoteJid || msg.key.remoteJid === 'status@broadcast') return;

  const messageType = getMessageType(msg);
  const chatId = normalizeJid(msg.key.remoteJid);
  const msgId = msg.key.id!;
  const timestamp = new Date((msg.messageTimestamp as number) * 1000 || Date.now());
  const content = getMessageContent(msg);
  const isFromMe = !!msg.key.fromMe;

  await Message.findOneAndUpdate(
    { msgId, instanceId },
    {
      $setOnInsert: {
        msgId,
        chatId,
        instanceId,
        from: isFromMe ? normalizeJid(sock?.user?.id || '') : normalizeJid(msg.key.participant || msg.key.remoteJid),
        to: isFromMe ? chatId : (sock?.user?.id ? normalizeJid(sock.user.id) : ''),
        fromMe: isFromMe,
        type: messageType,
        text: content.text,
        caption: content.caption,
        status: isFromMe ? 'sent' : 'delivered',
        timestamp,
        rawMessage: msg.message as Record<string, unknown>,
      },
    },
    { upsert: true }
  );

  const chatUpdate: any = {
    $set: {
      lastMessage: {
        content: content.text || content.caption || `[${messageType}]`,
        timestamp,
        fromMe: isFromMe,
        type: messageType,
      },
    },
  };

  if (!isFromMe) {
    chatUpdate.$inc = { unreadCount: 1 };
  }

  await Chat.findOneAndUpdate(
    { chatId, instanceId },
    chatUpdate,
    { upsert: true }
  );

  if (isFromMe) {
    await WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1, messagesToday: 1 } });
  } else {
    await WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesReceived: 1, messagesToday: 1 } });
    waEvents.emit(`message:${instanceId}`, { chatId, msgId, type: messageType });

    // Trigger Chatbot Auto-Responder if enabled
    handleChatbotAutoResponse(instanceId, chatId, content.text || content.caption || '', sock).catch((e) =>
      logger.error(`[${instanceId}] Chatbot auto-response error`, { e })
    );
  }
}

async function handleChatbotAutoResponse(instanceId: string, toJid: string, incomingText: string, sock: WASocket) {
  try {
    const { Chatbot } = await import('../models/Chatbot');
    const chatbot = await Chatbot.findOne({ instanceId, enabled: true }).lean();
    if (!chatbot || !incomingText) return;

    const lowerText = incomingText.toLowerCase().trim();
    let reply: string | null = null;

    for (const rule of chatbot.rules) {
      const kw = rule.keyword.toLowerCase().trim();
      if (!kw) continue;
      let matched = false;
      if (rule.matchType === 'exact' && lowerText === kw) matched = true;
      else if (rule.matchType === 'startsWith' && lowerText.startsWith(kw)) matched = true;
      else if (rule.matchType === 'contains' && lowerText.includes(kw)) matched = true;

      if (matched) {
        reply = rule.response;
        break;
      }
    }

    if (!reply && chatbot.fallbackMessage) {
      reply = chatbot.fallbackMessage;
    }

    if (reply) {
      const normalizedTo = normalizeJid(toJid);
      let res: any;
      try {
        res = await sock.sendMessage(normalizedTo, { text: reply });
      } catch (err: any) {
        if (err instanceof SafeModeError) {
          // Safe Mode blocked the chatbot reply — log and skip silently
          // (e.g. outside sending window or daily cap). Do not crash.
          logger.warn(`[${instanceId}] Chatbot reply blocked by Safe Mode`, {
            code: err.code,
            detail: err.detail,
          });
          return;
        }
        throw err;
      }
      await Message.create({
        msgId: res?.key?.id || 'bot_' + Date.now(),
        chatId: normalizedTo,
        instanceId,
        from: sock?.user?.id || 'chatbot',
        to: normalizedTo,
        fromMe: true,
        type: 'text',
        text: reply,
        status: 'sent',
        timestamp: new Date(),
      });
      await Chat.findOneAndUpdate(
        { chatId: normalizedTo, instanceId },
        {
          $set: {
            lastMessage: {
              content: reply,
              timestamp: new Date(),
              fromMe: true,
              type: 'text',
            },
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    logger.error(`[${instanceId}] Error in chatbot auto response`, { err });
  }
}

function getMessageType(msg: proto.IWebMessageInfo): string {
  const m = msg.message;
  if (!m) return 'unknown';
  if (m.conversation || m.extendedTextMessage) return 'text';
  if (m.imageMessage) return 'image';
  if (m.videoMessage) return 'video';
  if (m.audioMessage) return 'audio';
  if (m.documentMessage) return 'document';
  if (m.stickerMessage) return 'sticker';
  if (m.reactionMessage) return 'reaction';
  if (m.locationMessage) return 'location';
  return 'unknown';
}

function getMessageContent(msg: proto.IWebMessageInfo): { text?: string; caption?: string } {
  const m = msg.message;
  if (!m) return {};
  if (m.conversation) return { text: m.conversation };
  if (m.extendedTextMessage) return { text: m.extendedTextMessage.text || '' };
  if (m.imageMessage) return { caption: m.imageMessage.caption || '' };
  if (m.videoMessage) return { caption: m.videoMessage.caption || '' };
  if (m.documentMessage) return { caption: m.documentMessage.caption || '' };
  return {};
}

function scheduleReconnect(instanceId: string, delayMs = 5000): void {
  if (reconnectTimers.has(instanceId)) return;
  const timer = setTimeout(async () => {
    reconnectTimers.delete(instanceId);
    await initWhatsApp(instanceId);
  }, delayMs);
  reconnectTimers.set(instanceId, timer);
}

export function getSocket(instanceId: string = 'default'): WASocket | null {
  return sockets.get(instanceId) || null;
}

export async function getInstanceStatus(instanceId: string = 'default') {
  return WhatsAppInstance.findOne({ instanceId }).select('-qrCode');
}

export async function getQRCode(instanceId: string = 'default'): Promise<string | null> {
  const instance = await WhatsAppInstance.findOne({ instanceId }).select('+qrCode');
  if (!instance || instance.status !== 'qr_ready') return null;
  if (instance.qrExpiresAt && instance.qrExpiresAt < new Date()) {
    return null;
  }
  return instance.qrCode;
}

export async function disconnectWhatsApp(instanceId: string = 'default'): Promise<void> {
  manualDisconnects.set(instanceId, true);
  // Clear all timers
  const timer = reconnectTimers.get(instanceId);
  if (timer) { clearTimeout(timer); reconnectTimers.delete(instanceId); }
  reconnectAttempts.delete(instanceId);

  const sock = sockets.get(instanceId);
  if (sock) {
    try {
      await sock.logout();
    } catch {
      try { sock.end(undefined); } catch {}
    }
    sockets.delete(instanceId);
  }

  // Logout invalidates creds server-side; stale auth files must go or the
  // next connect attempt reuses them and never gets a fresh QR.
  const sessionDir = path.join(process.cwd(), env.SESSION_DIR, instanceId);
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {}
  }

  await WhatsAppInstance.findOneAndUpdate(
    { instanceId },
    {
      status: 'disconnected',
      phone: null,
      pushName: null,
      profilePicUrl: null,
      qrCode: null,
      qrExpiresAt: null,
    }
  );

  manualDisconnects.set(instanceId, false);
  connectingStates.set(instanceId, false);
}

export async function restartWhatsApp(instanceId: string = 'default'): Promise<void> {
  // Clear all timers and counters
  const timer = reconnectTimers.get(instanceId);
  if (timer) { clearTimeout(timer); reconnectTimers.delete(instanceId); }
  reconnectAttempts.delete(instanceId);

  const sock = sockets.get(instanceId);
  if (sock) {
    manualDisconnects.set(instanceId, true);
    try { sock.end(undefined); } catch {}
    sockets.delete(instanceId);
    await new Promise((r) => setTimeout(r, 800));
  }

  manualDisconnects.set(instanceId, false);
  connectingStates.set(instanceId, false);
  await initWhatsApp(instanceId);
}

export async function deleteSession(instanceId: string = 'default'): Promise<void> {
  manualDisconnects.set(instanceId, true);
  // Clear all timers and counters
  const timer = reconnectTimers.get(instanceId);
  if (timer) { clearTimeout(timer); reconnectTimers.delete(instanceId); }
  reconnectAttempts.delete(instanceId);

  const sessionDir = path.join(process.cwd(), env.SESSION_DIR, instanceId);
  const sock = sockets.get(instanceId);
  if (sock) {
    try { await sock.logout(); } catch {}
    try { sock.end(undefined); } catch {}
    sockets.delete(instanceId);
  }

  await new Promise((r) => setTimeout(r, 500));

  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {}
  }

  // Purge user's isolated data
  await Promise.all([
    Chat.deleteMany({ instanceId }),
    Contact.deleteMany({ instanceId }),
    Message.deleteMany({ instanceId }),
  ]);

  await WhatsAppInstance.findOneAndUpdate(
    { instanceId },
    {
      status: 'disconnected',
      phone: null,
      pushName: null,
      profilePicUrl: null,
      platform: null,
      qrCode: null,
      qrExpiresAt: null,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      lastSyncAt: null,
      totalChats: 0,
      totalContacts: 0,
      messagesToday: 0,
      messagesSent: 0,
      messagesReceived: 0,
    }
  );

  manualDisconnects.set(instanceId, false);
  connectingStates.set(instanceId, false);
}
