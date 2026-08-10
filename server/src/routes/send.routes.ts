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

const buttonSchema = z.object({
  to: z.string().min(5).max(30),
  text: z.string().min(1).max(4096),
  footer: z.string().optional(),
  buttons: z.array(
    z.object({
      type: z.enum(['reply', 'url', 'call']),
      displayText: z.string().min(1).max(100),
      idOrUrl: z.string().optional(),
    })
  ).min(1).max(5),
});

/**
 * @swagger
 * /api/send/button:
 *   post:
 *     summary: Send interactive button message (Tap Continue / Action buttons)
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, text, buttons]
 *             properties:
 *               to:
 *                 type: string
 *                 example: "1234567890"
 *               text:
 *                 type: string
 *                 example: "Tap Continue to claim your exclusive discount offer!"
 *               footer:
 *                 type: string
 *                 example: "Blastup Automation Platform"
 *               buttons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [type, displayText]
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [reply, url, call]
 *                       example: "url"
 *                     displayText:
 *                       type: string
 *                       example: "Tap Continue"
 *                     idOrUrl:
 *                       type: string
 *                       example: "https://example.com/checkout"
 *     responses:
 *       200:
 *         description: Button message sent successfully
 */
router.post('/button', validate(buttonSchema), sendController.sendButton);

const sliderSchema = z.object({
  to: z.string().min(5).max(30),
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(4096),
  footer: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      price: z.string().optional(),
      buttonText: z.string().optional(),
      buttonId: z.string().optional(),
    })
  ).min(1).max(10),
});

/**
 * @swagger
 * /api/send/slider:
 *   post:
 *     summary: Send eCommerce slider / carousel multi-card message
 *     tags: [Send]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, title, text, items]
 *             properties:
 *               to:
 *                 type: string
 *                 example: "1234567890"
 *               title:
 *                 type: string
 *                 example: "Featured Product Showcase"
 *               text:
 *                 type: string
 *                 example: "Check out our top recommended products for today:"
 *               footer:
 *                 type: string
 *                 example: "Blastup Store"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [title]
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Wireless Headphones X100"
 *                     description:
 *                       type: string
 *                       example: "Noise cancelling bluetooth headphones"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
 *                     price:
 *                       type: string
 *                       example: "$99.99"
 *                     buttonText:
 *                       type: string
 *                       example: "Buy Now"
 *                     buttonId:
 *                       type: string
 *                       example: "prod_100"
 *     responses:
 *       200:
 *         description: eCommerce slider message sent successfully
 */
router.post('/slider', validate(sliderSchema), sendController.sendSlider);

export default router;

