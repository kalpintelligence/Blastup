import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: List all chats
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of chats
 */
router.get('/', chatController.getChats);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   get:
 *     summary: Get a specific chat
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat details
 */
router.get('/:chatId', chatController.getChat);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get messages for a specific chat
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/:chatId/messages', chatController.getMessages);

/**
 * @swagger
 * /api/chats/{chatId}/read:
 *   patch:
 *     summary: Mark a chat as read
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat marked as read
 */
router.patch('/:chatId/read', chatController.markRead);

/**
 * @swagger
 * /api/chats/messages/{msgId}:
 *   delete:
 *     summary: Delete a message locally
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: msgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete('/messages/:msgId', chatController.deleteMessage);

export default router;
