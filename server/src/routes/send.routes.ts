import { Router } from 'express';
import * as sendController from '../controllers/send.controller';
import { authenticate } from '../middleware/auth';
import { sendLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);
router.use(sendLimiter);

const sendTextSchema = z.object({
  to: z.string().min(5).max(30),
  text: z.string().min(1).max(4096),
});

/**
 * @swagger
 * /api/send/text:
 *   post:
 *     summary: Send a text message
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, text]
 *             properties:
 *               to:
 *                 type: string
 *                 description: Mobile number with country code
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post('/text', validate(sendTextSchema), sendController.sendText);

/**
 * @swagger
 * /api/send/image:
 *   post:
 *     summary: Send an image
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [to, file]
 *             properties:
 *               to:
 *                 type: string
 *               caption:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image sent
 */
router.post('/image', sendController.upload.single('file'), sendController.sendImage);

/**
 * @swagger
 * /api/send/video:
 *   post:
 *     summary: Send a video
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [to, file]
 *             properties:
 *               to:
 *                 type: string
 *               caption:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video sent
 */
router.post('/video', sendController.upload.single('file'), sendController.sendVideo);

/**
 * @swagger
 * /api/send/audio:
 *   post:
 *     summary: Send an audio file
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [to, file]
 *             properties:
 *               to:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Audio sent
 */
router.post('/audio', sendController.upload.single('file'), sendController.sendAudio);

/**
 * @swagger
 * /api/send/document:
 *   post:
 *     summary: Send a document
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [to, file]
 *             properties:
 *               to:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document sent
 */
router.post('/document', sendController.upload.single('file'), sendController.sendDocument);

export default router;
