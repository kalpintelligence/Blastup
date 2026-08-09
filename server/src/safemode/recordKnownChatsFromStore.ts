import { SafeModeManager } from './SafeModeManager';
import { Chat } from '../models/Chat';

/**
 * recordKnownChatsFromStore
 *
 * Seeds the Safe Mode store with the number of existing chats for this
 * phone number, sourced from our local MongoDB Chat collection.
 *
 * This prevents existing numbers (with real chat histories) from being
 * treated as brand-new accounts when Safe Mode first activates. Without
 * this call, a number with 1000 existing contacts would hit Tier 1's
 * "new chats per day" cap immediately.
 *
 * Also pre-populates the seen-JIDs set by marking all existing chat IDs
 * as "already seen", so existing contacts are not counted as new chats
 * on first send.
 *
 * Call this immediately before `wrapBaileysSocket` on `connection === 'open'`.
 */
export async function recordKnownChatsFromStore(
  _sock: unknown, // socket param kept for API symmetry — not needed here
  manager: SafeModeManager,
  phoneId: string
): Promise<void> {
  try {
    // Get all chat JIDs for this instance
    const chats = await Chat.find({ instanceId: phoneId }, { chatId: 1, _id: 0 }).lean();

    if (chats.length === 0) return;

    const store = (manager as any).store;
    if (!store) return;

    // Set the known chat count so the manager knows baseline
    await store.setKnownChatCount(phoneId, chats.length);

    // Mark each existing chat JID as seen so they don't count as "new chats"
    // Batch in groups of 100 to avoid overwhelming Redis with individual calls
    const BATCH_SIZE = 100;
    for (let i = 0; i < chats.length; i += BATCH_SIZE) {
      const batch = chats.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((chat: any) => store.markJidSeen(phoneId, chat.chatId))
      );
    }
  } catch (err) {
    // Non-fatal — if this fails, Safe Mode will still work, just more conservative
    console.warn(`[SafeMode] recordKnownChatsFromStore failed for ${phoneId}:`, err);
  }
}
