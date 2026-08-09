import { SafeModeManager } from './SafeModeManager';
import { SafeModeError } from './SafeModeError';
import { normalizeJid } from '../utils/jid';

/**
 * wrapBaileysSocket
 *
 * Patches the Baileys WASocket in-place so that Safe Mode checks are applied
 * before every outgoing operation. Returns the same socket object.
 *
 * Methods intercepted:
 *   - sendMessage
 *   - groupCreate
 *   - groupParticipantsUpdate
 *
 * Additionally registers a `messages.upsert` listener to track incoming
 * replies for reply-rate calculation. This coexists harmlessly with any
 * existing `messages.upsert` listener registered on the socket — both
 * fire independently.
 *
 * If Safe Mode is disabled for this phoneId all intercepted methods pass
 * through to the original implementation with zero overhead.
 */
export function wrapBaileysSocket(sock: any, manager: SafeModeManager, phoneId: string): any {

  // ── Wrap sendMessage ───────────────────────────────────────────────────
  const originalSendMessage = sock.sendMessage.bind(sock);

  sock.sendMessage = async function (toJid: string, content: any, ...rest: any[]) {
    // Extract text payload for link detection
    const text: string | undefined =
      content?.text ||
      content?.caption ||
      content?.conversation ||
      content?.extendedTextMessage?.text ||
      undefined;

    await manager.checkAndRecord(phoneId, {
      toJid: normalizeJid(toJid),
      text,
    });

    return originalSendMessage(toJid, content, ...rest);
  } as typeof sock.sendMessage;

  // ── Wrap groupCreate ───────────────────────────────────────────────────
  if (typeof sock.groupCreate === 'function') {
    const originalGroupCreate = sock.groupCreate.bind(sock);
    sock.groupCreate = async function (...args: any[]) {
      await manager.checkAndRecord(phoneId, {
        toJid: 'group@g.us', // placeholder — groups don't have a recipient JID
        isGroupCreate: true,
      });
      return originalGroupCreate(...args);
    } as typeof sock.groupCreate;
  }

  // ── Wrap groupParticipantsUpdate ───────────────────────────────────────
  if (typeof sock.groupParticipantsUpdate === 'function') {
    const originalGPU = sock.groupParticipantsUpdate.bind(sock);
    sock.groupParticipantsUpdate = async function (...args: any[]) {
      await manager.checkAndRecord(phoneId, {
        toJid: 'group@g.us',
        isGroupUpdate: true,
      });
      return originalGPU(...args);
    } as typeof sock.groupParticipantsUpdate;
  }

  // ── Reply tracking listener ────────────────────────────────────────────
  // We use 'on' not 'process' so it coexists with the existing messages.upsert
  // handler in whatsapp.service.ts — both fire, order doesn't matter.
  sock.ev.on('messages.upsert', async ({ messages, type }: { messages: any[]; type: string }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        // Only track incoming messages (from others), not our own
        if (msg.key?.fromMe) continue;
        if (!msg.key?.remoteJid || msg.key.remoteJid === 'status@broadcast') continue;

        const fromJid = normalizeJid(msg.key.remoteJid);
        await manager.recordReply(phoneId, fromJid);
      } catch {
        // Never let reply tracking break message processing
      }
    }
  });

  return sock;
}
