import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';
import { normalizeJid } from '../utils/jid';

export async function listChats(instanceId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search as string | undefined;
  const unreadOnly = query.unreadOnly === 'true';

  const filter: Record<string, unknown> = { instanceId };
  if (search) filter.$text = { $search: search };
  if (unreadOnly) filter.unreadCount = { $gt: 0 };

  const [data, total] = await Promise.all([
    Chat.find(filter)
      .sort({ isPinned: -1, 'lastMessage.timestamp': -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Chat.countDocuments(filter),
  ]);

  return buildPaginatedResult(data, total, { page, limit, skip });
}

export async function getChatById(instanceId: string, chatId: string) {
  const normalized = normalizeJid(chatId);
  return Chat.findOne({
    $or: [{ chatId }, { chatId: normalized }],
    instanceId,
  }).lean();
}

export async function getMessages(instanceId: string, chatId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const normalized = normalizeJid(chatId);
  // Only match the specific chatId (exact or normalized) - do NOT match by from/to which causes duplicates
  const filter = {
    instanceId,
    isDeleted: false,
    chatId: { $in: [chatId, normalized] },
  };

  const [data, total] = await Promise.all([
    Message.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-rawMessage')
      .lean(),
    Message.countDocuments(filter),
  ]);

  return buildPaginatedResult(data.reverse(), total, { page, limit, skip });
}

export async function markChatRead(instanceId: string, chatId: string) {
  const normalized = normalizeJid(chatId);
  return Chat.findOneAndUpdate(
    { $or: [{ chatId }, { chatId: normalized }], instanceId },
    { unreadCount: 0 },
    { new: true }
  );
}

export async function deleteMessageLocally(instanceId: string, msgId: string) {
  return Message.findOneAndUpdate(
    { msgId, instanceId },
    { isDeleted: true }
  );
}
