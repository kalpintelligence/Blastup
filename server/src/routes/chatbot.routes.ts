import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/chatbot:
 *   get:
 *     summary: Get chatbot configuration for the current instance
 *     tags: [Chatbot]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Chatbot configuration object
 *   put:
 *     summary: Update chatbot configuration
 *     tags: [Chatbot]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               welcomeMessage:
 *                 type: string
 *               fallbackMessage:
 *                 type: string
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     keyword:
 *                       type: string
 *                     response:
 *                       type: string
 *                     matchType:
 *                       type: string
 *                       enum: [exact, contains, startsWith]
 *     responses:
 *       200:
 *         description: Updated chatbot configuration
 */
router.get('/', chatbotController.getChatbot);
router.put('/', chatbotController.updateChatbot);

export default router;
