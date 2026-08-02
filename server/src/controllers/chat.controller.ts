import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as chatService from '../services/chat.service';

export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const result = await chatService.listChats(instanceId, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const chat = await chatService.getChatById(instanceId, req.params.chatId);
    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found' });
      return;
    }
    res.json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const result = await chatService.getMessages(instanceId, req.params.chatId, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    await chatService.markChatRead(instanceId, req.params.chatId);
    res.json({ success: true, message: 'Chat marked as read' });
  } catch (err) {
    next(err);
  }
}

export async function deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    await chatService.deleteMessageLocally(instanceId, req.params.msgId);
    res.json({ success: true, message: 'Message deleted locally' });
  } catch (err) {
    next(err);
  }
}
