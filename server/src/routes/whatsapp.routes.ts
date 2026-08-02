import { Router } from 'express';
import * as waController from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth';
import { qrLimiter } from '../middleware/rateLimit';

const router = Router();

// All WhatsApp routes are protected
router.use(authenticate);

/**
 * @swagger
 * /api/whatsapp/status:
 *   get:
 *     summary: Get WhatsApp connection status
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Connection status
 */
router.get('/status', waController.getStatus);

/**
 * @swagger
 * /api/whatsapp/qr:
 *   get:
 *     summary: Get QR code for linking
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Base64 QR code image
 */
router.get('/qr', qrLimiter, waController.getQR);

/**
 * @swagger
 * /api/whatsapp/reconnect:
 *   post:
 *     summary: Force reconnect socket
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Reconnection initiated
 */
router.post('/reconnect', waController.reconnect);

/**
 * @swagger
 * /api/whatsapp/logout:
 *   post:
 *     summary: Logout WhatsApp session from the device
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp logged out
 */
router.post('/logout', waController.logout);

/**
 * @swagger
 * /api/whatsapp/session:
 *   delete:
 *     summary: Hard delete the local WhatsApp session files
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.delete('/session', waController.deleteSession);

export default router;
