import { jidNormalizedUser } from '@whiskeysockets/baileys';

/**
 * Normalizes any WhatsApp JID or raw phone number to standard user JID (e.g. 919876543210@s.whatsapp.net).
 * Strips device suffixes (e.g. :12@s.whatsapp.net -> @s.whatsapp.net).
 */
export function normalizeJid(jidOrPhone: string): string {
  if (!jidOrPhone) return '';

  if (jidOrPhone.endsWith('@g.us') || jidOrPhone.endsWith('@broadcast')) {
    return jidOrPhone;
  }

  if (jidOrPhone.includes('@')) {
    return jidNormalizedUser(jidOrPhone);
  }

  const cleaned = jidOrPhone.replace(/[^0-9]/g, '');
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Formats raw phone number or JID into a clean readable international phone format.
 * e.g. "919876543210@s.whatsapp.net" -> "+91 98765 43210"
 */
export function formatPhoneNumber(input: string | null | undefined): string {
  if (!input) return '';

  // Extract raw digits
  const rawJid = input.split('@')[0].split(':')[0];
  const digits = rawJid.replace(/[^0-9]/g, '');

  if (!digits) return input;

  // Format based on digit count (e.g. Indian 12 digits, US/Canada 11 digits, UK 12 digits, standard 10 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    // India: +91 98765 43210
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US / Canada: +1 (415) 555-2671
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 12 && digits.startsWith('44')) {
    // UK: +44 7123 456789
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 10) {
    // 10-digit number: 98765 43210
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length > 5) {
    return `+${digits.slice(0, digits.length - 10 || 2)} ${digits.slice(-10, -5)} ${digits.slice(-5)}`;
  }

  return `+${digits}`;
}

/**
 * Normalizes existing database records (merging chats with device suffixes).
 */
export async function normalizeExistingDatabase() {
  try {
    const { Chat } = await import('../models/Chat');
    const { Message } = await import('../models/Message');
    const { Contact } = await import('../models/Contact');

    // Find chats with device specifiers (contain :)
    const deviceChats = await Chat.find({ chatId: /:/ }).lean();
    for (const chat of deviceChats) {
      const normalized = normalizeJid(chat.chatId);
      if (normalized !== chat.chatId) {
        // Merge into normalized chat entry
        await Chat.findOneAndUpdate(
          { chatId: normalized, instanceId: chat.instanceId },
          {
            $set: {
              name: chat.name || undefined,
              lastMessage: chat.lastMessage || undefined,
            },
          },
          { upsert: true }
        );
        // Delete original device chat entry
        await Chat.deleteOne({ _id: chat._id });
        // Update messages chatId
        await Message.updateMany(
          { chatId: chat.chatId, instanceId: chat.instanceId },
          { $set: { chatId: normalized } }
        );
      }
    }

    // Normalize contact JIDs with device specifiers
    const deviceContacts = await Contact.find({ jid: /:/ }).lean();
    for (const contact of deviceContacts) {
      const normalized = normalizeJid(contact.jid);
      if (normalized !== contact.jid) {
        const phone = normalized.split('@')[0];
        await Contact.findOneAndUpdate(
          { jid: normalized, instanceId: contact.instanceId },
          {
            $set: {
              phone,
              name: contact.name || undefined,
              pushName: contact.pushName || undefined,
            },
          },
          { upsert: true }
        );
        await Contact.deleteOne({ _id: contact._id });
      }
    }
  } catch {
    // silent
  }
}

