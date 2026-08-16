import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
  Browsers,
  normalizeMessageContent,
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

type ApiRequestNode = {
  id: string;
  type: 'apiRequest';
  content?: string;
  inputVariable?: string;
  inputPrompt?: string;
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST';
  apiHeaders?: Record<string, string>;
};

// A customer may be part-way through an API step (for example, after being
// asked for an order ID). This is deliberately account-scoped so two tenants
// can never use each other's variable values.
const pendingApiRequests = new Map<string, ApiRequestNode>();
const naturalReplyVersions = new Map<string, number>();
const API_REQUEST_TIMEOUT_MS = 10_000;

function interpolateTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_match, rawKey: string) => {
    const value = rawKey.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object') return (current as Record<string, unknown>)[key];
      return undefined;
    }, values);
    return value === undefined || value === null ? '' : String(value);
  });
}

export async function runApiRequest(node: ApiRequestNode, customerValue: string): Promise<string> {
  const variable = (node.inputVariable || 'input').replace(/[^a-zA-Z0-9_]/g, '') || 'input';
  if (!node.apiUrl) throw new Error('API URL is missing');

  const urlText = interpolateTemplate(node.apiUrl, { [variable]: encodeURIComponent(customerValue) });
  const url = new URL(urlText);
  // Keep integrations encrypted in transit; local development endpoints are
  // intentionally not accepted by this production flow action.
  if (url.protocol !== 'https:') throw new Error('Only HTTPS API URLs are allowed');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: node.apiMethod === 'POST' ? 'POST' : 'GET',
      headers: { Accept: 'application/json', ...(node.apiHeaders || {}) },
      body: node.apiMethod === 'POST'
        ? JSON.stringify({ [variable]: customerValue })
        : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data: unknown = await response.json();
    return interpolateTemplate(node.content || 'Your request is complete.', {
      [variable]: customerValue,
      input: customerValue,
      ...(data && typeof data === 'object' ? data as Record<string, unknown> : { data }),
      data,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Supports both local relative paths and Docker's absolute /app/sessions mount. */
function getSessionDir(instanceId: string): string {
  const baseDir = path.isAbsolute(env.SESSION_DIR)
    ? env.SESSION_DIR
    : path.resolve(process.cwd(), env.SESSION_DIR);
  return path.join(baseDir, instanceId);
}

/** Creates an empty, private WhatsApp instance without starting a connection. */
export async function provisionWhatsAppInstance(instanceId: string) {
  const sessionPath = getSessionDir(instanceId);
  return WhatsAppInstance.findOneAndUpdate(
    { instanceId },
    { $setOnInsert: { instanceId, sessionPath, status: 'disconnected' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function initWhatsApp(instanceId: string): Promise<void> {
  if (connectingStates.get(instanceId)) {
    return;
  }

  connectingStates.set(instanceId, true);

  try {
    const sessionDir = getSessionDir(instanceId);
    fs.mkdirSync(sessionDir, { recursive: true });

    await WhatsAppInstance.findOneAndUpdate(
      { instanceId },
      { $set: { status: 'connecting' }, $setOnInsert: { instanceId, sessionPath: sessionDir } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
        const connectedPhone = info?.id?.split(':')[0] || null;
        if (connectedPhone) {
          const duplicateInstances = await WhatsAppInstance.find({
            instanceId: { $ne: instanceId },
            phone: connectedPhone,
            status: 'connected',
          }).select('instanceId');
          for (const duplicate of duplicateInstances) {
            const duplicateSocket = sockets.get(duplicate.instanceId);
            if (duplicateSocket) {
              manualDisconnects.set(duplicate.instanceId, true);
              duplicateSocket.end(new Error('A newer Blastup session connected for this WhatsApp number'));
              sockets.delete(duplicate.instanceId);
            }
            await WhatsAppInstance.updateOne(
              { instanceId: duplicate.instanceId },
              { $set: { status: 'disconnected', lastDisconnectedAt: new Date() } }
            );
            logger.warn(`[${instanceId}] Disconnected duplicate session ${duplicate.instanceId} for ${connectedPhone}`);
          }
        }
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
            phone: connectedPhone,
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
          const sessionDir = getSessionDir(instanceId);
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
        const { Reminder } = await import('../models/Reminder');
        await Reminder.findOneAndUpdate(
          { whatsappMessageId: receipt.key.id, instanceId, actionType: 'SEND_MESSAGE' },
          {
            $set: { deliveryStatus: status, deliveredAt: new Date(), status: 'completed' },
            $push: { history: { at: new Date(), type: status, message: `WhatsApp marked message as ${status}` } },
          }
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
  const alternateMessageJid = normalizeJid(String((msg.key as any).remoteJidAlt || ''));

  await Message.findOneAndUpdate(
    { msgId, instanceId },
    {
      $setOnInsert: {
        msgId,
        chatId,
        instanceId,
        from: isFromMe ? normalizeJid(sock?.user?.id || '') : (alternateMessageJid || normalizeJid(msg.key.participant || msg.key.remoteJid)),
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

  const myJid = sock?.user?.id ? normalizeJid(sock.user.id) : '';
  const alternateChatId = normalizeJid(String((msg.key as any).remoteJidAlt || ''));
  const isSelfChat = isFromMe && (
    chatId === myJid ||
    alternateChatId === myJid ||
    chatId.split('@')[0] === myJid.split('@')[0] ||
    (alternateChatId && alternateChatId.split('@')[0] === myJid.split('@')[0]) ||
    (sock?.user?.id && chatId.includes(sock.user.id.split(':')[0]))
  );

  if (isFromMe && !isSelfChat) {
    await WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1, messagesToday: 1 } });
  } else {
    await WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesReceived: 1, messagesToday: 1 } });
    waEvents.emit(`message:${instanceId}`, { chatId, msgId, type: messageType });

    let incomingText = content.text || content.caption || '';
    if (/^\/s(?:\s|$)/i.test(incomingText)) {
      const shortcuts = [
        '📱 Blastup shortcuts',
        '• /t <request> — task, reminder, or scheduled message',
        '• /t-<id> time 6:30 PM — reschedule',
        '• /t-<id> message <text> — edit message',
        '• /t-<id> contact <name> — change contact',
        '• /t-<id> completed — complete task',
        '• /t-<id> cancel — cancel task',
        '• /c — create a campaign (self-chat only)',
        '• /wac — create a WhatsApp chatbot flow (self-chat only)',
        '• /r <question> — reports and summaries (self-chat only)',
        '• /r help — report examples',
        '• /s — show all shortcuts',
      ].join('\n');
      await sock.sendMessage(chatId, { text: shortcuts, __blastupSystemReply: true } as any);
      return;
    }
    if (isSelfChat) {
      const { understandAutomation } = await import('./openai-assistant.service');
      const aiRoute = await understandAutomation(instanceId, incomingText);
      if (aiRoute && aiRoute.intent !== 'none' && aiRoute.command) incomingText = aiRoute.command;
      const { handleWhatsAppReportCommand } = await import('./whatsapp-report.service');
      const reportResult = await handleWhatsAppReportCommand(instanceId, incomingText);
      if (reportResult) {
        await sock.sendMessage(chatId, { text: reportResult.reply, __blastupSystemReply: true } as any);
        return;
      }
      const { handleWhatsAppBuilderCommand } = await import('./whatsapp-builder.service');
      const builderResult = await handleWhatsAppBuilderCommand(instanceId, chatId, incomingText);
      if (builderResult) {
        const { naturalizeSystemReply } = await import('./natural-style.service');
        const reply = await naturalizeSystemReply(instanceId, chatId, incomingText, builderResult.reply);
        await sock.sendMessage(chatId, { text: reply, __blastupSystemReply: true } as any);
        return;
      }
    }
    try {
      const { handleReminderCommand } = await import('./reminder.service');
      const reminderResult = await handleReminderCommand(instanceId, chatId, incomingText, msgId);
      if (reminderResult) {
        const taskResult = reminderResult as { reply: string; silent?: boolean; created?: boolean };
        if (taskResult.silent) return;
        const isNewTaskCommand = /^\/t(?:\s|$)/i.test(incomingText) || /^\/t-contact\b/i.test(incomingText);
        if (isNewTaskCommand && !taskResult.created) return;
        const { naturalizeSystemReply } = await import('./natural-style.service');
        const reply = await naturalizeSystemReply(instanceId, chatId, incomingText, taskResult.reply);
        await sock.sendMessage(chatId, { text: reply, __blastupSystemReply: true } as any);
        return;
      }
    } catch (error) {
      logger.error(`[${instanceId}] Reminder command failed`, { error, chatId, msgId });
      if (/^\/t-(?:\d+|contact)\b/i.test(incomingText)) {
        await sock.sendMessage(chatId, { text: '⚠️ I could not create that task. Please check the format and try again.', __blastupSystemReply: true } as any);
        return;
      }
      if (/^\/t(?:\s|$)/i.test(incomingText)) return;
    }

    if (!isSelfChat) {
      const { generateChatReply, getChatReplyMode } = await import('./openai-assistant.service');
      const replyMode = await getChatReplyMode(instanceId);
      if (!replyMode.enabled) return;
      if (!replyMode.aiOnly) {
        handleChatbotAutoResponse(instanceId, chatId, incomingText, sock).catch((e) => logger.error(`[${instanceId}] Chatbot auto-response error`, { e }));
        return;
      }
      const replyKey = `${instanceId}:${chatId}`;
      const replyVersion = (naturalReplyVersions.get(replyKey) || 0) + 1;
      naturalReplyVersions.set(replyKey, replyVersion);
      if (!replyMode.cloudConfigured) { naturalReplyVersions.delete(replyKey); return; }
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (naturalReplyVersions.get(replyKey) !== replyVersion) return;
      await sock.readMessages([msg.key]).catch(error => logger.warn(`[${instanceId}] Could not mark AI chat message read`, { chatId, error: error instanceof Error ? error.message : String(error) }));
      const aiReply = await generateChatReply(instanceId, chatId, incomingText);
      if (aiReply) {
        const { learnedReplyDelay } = await import('./local-reply.service');
        const delay = await learnedReplyDelay(instanceId, chatId);
        await sock.sendPresenceUpdate('composing', chatId).catch(() => undefined);
        await new Promise(resolve => setTimeout(resolve, delay));
        if (naturalReplyVersions.get(replyKey) !== replyVersion) { await sock.sendPresenceUpdate('paused', chatId).catch(() => undefined); return; }
        await sock.sendMessage(chatId, { text: aiReply, __blastupSystemReply: true } as any);
        naturalReplyVersions.delete(replyKey);
        await sock.sendPresenceUpdate('paused', chatId).catch(() => undefined);
        return;
      }
      naturalReplyVersions.delete(replyKey);
      return;
    }

    // Trigger the configured rule-based chatbot when AI reply is disabled or unavailable.
    handleChatbotAutoResponse(instanceId, chatId, incomingText, sock).catch((e) =>
      logger.error(`[${instanceId}] Chatbot auto-response error`, { e })
    );
  }
}

async function handleChatbotAutoResponse(instanceId: string, toJid: string, incomingText: string, sock: WASocket) {
  try {
    const { Chatbot } = await import('../models/Chatbot');
    const { ChatbotKnowledge } = await import('../models/ChatbotKnowledge');
    const knowledgeEngine = await import('./knowledgeEngine');

    // Chatbot configuration is private to this WhatsApp instance.
    const chatbot = await Chatbot.findOne({
      instanceId,
      $or: [{ whatsappEnabled: true }, { whatsappEnabled: { $exists: false }, enabled: true }],
    }).lean();

    if (!chatbot || !incomingText) {
      logger.info(`[${instanceId}] Chatbot not enabled or no incoming text to auto-respond.`);
      return;
    }

    // Determine active reply mode ('nocode' vs 'standard' vs 'off')
    const activeFlows = chatbot.whatsappFlows?.length ? chatbot.whatsappFlows : chatbot.flows;
    const replySource = chatbot.replySource || (activeFlows && activeFlows.length > 0 ? 'nocode' : 'standard');

    if (replySource === 'off' || !(chatbot.whatsappEnabled ?? chatbot.enabled)) {
      logger.info(`[${instanceId}] Chatbot auto-response is turned off.`);
      return;
    }

    const lowerText = incomingText.toLowerCase().trim();
    let replyText: string | null = null;
    let replyImageUrl: string | undefined = undefined;
    let replyNode: any = null;
    const conversationKey = `${instanceId}:${normalizeJid(toJid)}`;
    const pendingApiRequest = pendingApiRequests.get(conversationKey);

    // ── MODE A: NO-CODE VISUAL FLOW ENGINE ─────────────────────────────────
    if (replySource === 'nocode' && pendingApiRequest) {
      pendingApiRequests.delete(conversationKey);
      replyNode = pendingApiRequest;
      try {
        replyText = await runApiRequest(pendingApiRequest, incomingText.trim());
      } catch (apiError) {
        logger.warn(`[${instanceId}] No-code API request failed`, { apiError, nodeId: pendingApiRequest.id });
        replyText = 'Sorry, I could not retrieve that information right now. Please check the ID and try again later.';
      }
    } else if (replySource === 'nocode') {
      if (activeFlows && Array.isArray(activeFlows) && activeFlows.length > 0) {
        const flows = activeFlows as any[];
        const startNodes = flows.filter(n => n.type === 'flowStart');
        const startNode = startNodes.find(node => (node.triggers || []).some((trigger: string) => {
          const value = trigger.toLowerCase().trim();
          return value && (lowerText === value || lowerText.startsWith(value) || lowerText.includes(value));
        })) || startNodes[0];
        const startTriggers = (startNode?.triggers || ['hi', 'hello', 'help', 'menu', 'studio', 'urban', 'start', 'hey']).map((t: string) => t.toLowerCase().trim());
        const isStartTrigger = startTriggers.some((trg: string) => lowerText === trg || lowerText.startsWith(trg) || lowerText.includes(trg));

        if (isStartTrigger) {
          // Find first connected node after start (e.g. mediaButtons or message)
          const welcomeNode = flows.find(n => n.id === startNode?.nextNodeId) || flows.find(n => n.type === 'mediaButtons') || flows.find(n => n.id !== 'node-start') || startNode;
          if (welcomeNode) {
            replyNode = welcomeNode;
            replyText = welcomeNode.content || welcomeNode.title;
            replyImageUrl = welcomeNode.imageUrl;

            if (welcomeNode.buttons && welcomeNode.buttons.length > 0) {
              const buttonList = welcomeNode.buttons
                .map((b: any, idx: number) => `${idx + 1}️⃣ *${b.label}*`)
                .join('\n');
              replyText += `\n\n${buttonList}\n\n_Reply with the option name or number to proceed._`;
            }
          }
        } else {
          // Check if user replied with a button label or button number
          for (const node of flows) {
            if (!node.buttons || !Array.isArray(node.buttons)) continue;

            for (let i = 0; i < node.buttons.length; i++) {
              const btn = node.buttons[i];
              const btnLabelLower = (btn.label || '').toLowerCase().trim();
              const btnIndexStr = String(i + 1);

              if (
                lowerText === btnLabelLower ||
                lowerText.includes(btnLabelLower) ||
                lowerText === btnIndexStr ||
                lowerText === `option ${btnIndexStr}` ||
                lowerText === `${btnIndexStr}.`
              ) {
                const targetNode = flows.find(n => n.id === (btn.targetNodeId || btn.nextNodeId));
                if (targetNode) {
                  replyNode = targetNode;
                  replyText = targetNode.content || targetNode.title;
                  replyImageUrl = targetNode.imageUrl;

                  if (targetNode.buttons && targetNode.buttons.length > 0) {
                    const subBtnList = targetNode.buttons
                      .map((b: any, idx: number) => `${idx + 1}️⃣ *${b.label}*`)
                      .join('\n');
                    replyText += `\n\n${subBtnList}\n\n_Reply with the option name or number._`;
                  }
                  break;
                }
              }
            }
            if (replyText) break;
          }

          // Check if user message matches any node specific triggers
          if (!replyText) {
            for (const node of flows) {
              if (node.triggers && Array.isArray(node.triggers)) {
                const matchedTrg = node.triggers.some((t: string) => lowerText.includes(t.toLowerCase().trim()));
                if (matchedTrg) {
                  replyNode = node;
                  replyText = node.content;
                  replyImageUrl = node.imageUrl;
                  if (node.buttons && node.buttons.length > 0) {
                    const bList = node.buttons.map((b: any, idx: number) => `${idx + 1}️⃣ *${b.label}*`).join('\n');
                    replyText += `\n\n${bList}`;
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }

    // API nodes first collect one customer value, then use the next inbound
    // message to call the configured endpoint and render its JSON fields.
    if (replyNode?.type === 'apiRequest' && !pendingApiRequest) {
      pendingApiRequests.set(conversationKey, replyNode as ApiRequestNode);
      replyText = replyNode.inputPrompt || `Please reply with your ${replyNode.inputVariable || 'details'}.`;
      replyImageUrl = undefined;
    }

    // ── MODE B: STANDARD RULES & AI KNOWLEDGE ENGINE ───────────────────────
    if (replySource === 'standard') {
      // 1. Evaluate Rule-based Auto-responder
      if (chatbot.rules && Array.isArray(chatbot.rules) && chatbot.rules.length > 0) {
        for (const rule of chatbot.rules) {
          const kw = (rule.keyword || '').toLowerCase().trim();
          if (!kw) continue;
          let matched = false;
          if (rule.matchType === 'exact' && lowerText === kw) matched = true;
          else if (rule.matchType === 'startsWith' && lowerText.startsWith(kw)) matched = true;
          else if (rule.matchType === 'contains' && lowerText.includes(kw)) matched = true;

          if (matched) {
            replyText = rule.response;
            break;
          }
        }
      }

      // 2. Evaluate Company Knowledge Engine
      if (!replyText) {
        try {
          const knowledgeItems = await ChatbotKnowledge.find({
            status: 'active',
          }).lean();

          if (knowledgeItems && knowledgeItems.length > 0) {
            const knowledgeResult = await knowledgeEngine.query(
              incomingText,
              knowledgeItems as any,
              toJid,
              chatbot.fallbackMessage
            );

            if (knowledgeResult && knowledgeResult.confidence >= 0.35) {
              replyText = knowledgeResult.reply;
            }
          }
        } catch (kErr) {
          logger.error(`[${instanceId}] Knowledge base query error:`, { kErr });
        }
      }

      // 3. Standard Fallback Message
      if (!replyText) {
        replyText = chatbot.fallbackMessage || chatbot.welcomeMessage ||
          "Hello! 👋 Thanks for messaging. Ask a question or leave your details and our team will connect with you right away.";
      }
    }

    // ── 5. Send WhatsApp Message ───────────────────────────────────────────
    if (replyText) {
      if (replyNode?.footer) replyText += `\n\n${replyNode.footer}`;
      const delayMs = Math.min(8000, Math.max(0, Number(replyNode?.responseDelaySeconds || 0) * 1000));
      if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
      const normalizedTo = normalizeJid(toJid);
      let res: any;

      try {
        if (replyImageUrl && replyImageUrl.startsWith('http')) {
          res = await sock.sendMessage(normalizedTo, {
            image: { url: replyImageUrl },
            caption: replyText,
          });
        } else {
          res = await sock.sendMessage(normalizedTo, { text: replyText });
        }
      } catch (sendErr: any) {
        if (sendErr instanceof SafeModeError) {
          logger.warn(`[${instanceId}] Chatbot reply blocked by Safe Mode`, {
            code: sendErr.code,
            detail: sendErr.detail,
          });
          return;
        }
        // Fallback to plain text if image send failed
        if (replyImageUrl) {
          res = await sock.sendMessage(normalizedTo, { text: replyText });
        } else {
          throw sendErr;
        }
      }

      await Message.create({
        msgId: res?.key?.id || 'bot_' + Date.now(),
        chatId: normalizedTo,
        instanceId,
        from: sock?.user?.id || 'chatbot',
        to: normalizedTo,
        fromMe: true,
        type: replyImageUrl ? 'image' : 'text',
        text: replyText,
        caption: replyImageUrl ? replyText : undefined,
        status: 'sent',
        timestamp: new Date(),
      });

      await Chat.findOneAndUpdate(
        { chatId: normalizedTo, instanceId },
        {
          $set: {
            lastMessage: {
              content: replyText,
              timestamp: new Date(),
              fromMe: true,
              type: replyImageUrl ? 'image' : 'text',
            },
          },
        },
        { upsert: true }
      );

      waEvents.emit(`message:${instanceId}`, { chatId: normalizedTo, msgId: res?.key?.id, type: replyImageUrl ? 'image' : 'text' });

      logger.info(`[${instanceId}] Chatbot auto-response successfully sent to ${normalizedTo}`);
    }
  } catch (err) {
    logger.error(`[${instanceId}] Error in chatbot auto response`, { err });
  }
}

function getMessageType(msg: proto.IWebMessageInfo): string {
  const m = normalizeMessageContent(msg.message);
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
  const m = normalizeMessageContent(msg.message);
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

export function getSocket(instanceId: string): WASocket | null {
  return sockets.get(instanceId) || null;
}

export async function getInstanceStatus(instanceId: string) {
  return WhatsAppInstance.findOne({ instanceId }).select('-qrCode');
}

export async function getQRCode(instanceId: string): Promise<string | null> {
  const instance = await WhatsAppInstance.findOne({ instanceId }).select('+qrCode');
  if (!instance || instance.status !== 'qr_ready') return null;
  if (instance.qrExpiresAt && instance.qrExpiresAt < new Date()) {
    return null;
  }
  return instance.qrCode;
}

export async function disconnectWhatsApp(instanceId: string): Promise<void> {
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
  const sessionDir = getSessionDir(instanceId);
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

export async function restartWhatsApp(instanceId: string): Promise<void> {
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

export async function deleteSession(instanceId: string): Promise<void> {
  manualDisconnects.set(instanceId, true);
  // Clear all timers and counters
  const timer = reconnectTimers.get(instanceId);
  if (timer) { clearTimeout(timer); reconnectTimers.delete(instanceId); }
  reconnectAttempts.delete(instanceId);

  const sessionDir = getSessionDir(instanceId);
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
