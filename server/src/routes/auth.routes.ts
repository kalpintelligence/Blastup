import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import multer from 'multer';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  password: z.string().min(1).max(128),
});

const registerSchema = z.object({
  email: z.string().email().max(254).trim(),
  phone: z.string().min(7).max(20).trim(),
  password: z.string().min(8).max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
const aiSettingsSchema = z.object({
  apiKey: z.string().trim().min(20).max(300).optional(),
  geminiApiKey: z.string().trim().min(20).max(300).optional(),
  removeApiKey: z.boolean().optional(),
  removeGeminiKey: z.boolean().optional(),
  aiProvider: z.enum(['auto', 'openai', 'gemini']).optional(),
  aiAutomationEnabled: z.boolean().optional(),
  aiReplyEnabled: z.boolean().optional(),
  aiOnlyReplyEnabled: z.boolean().optional(),
  aiOwnerName: z.string().trim().max(100).optional(),
  aiRelationshipNotes: z.string().trim().max(5000).optional(),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', loginLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out user session
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get currently authenticated user details
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', authenticate, authController.me);

/**
 * @swagger
 * /api/auth/password:
 *   patch:
 *     summary: Change account password
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.patch('/password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.patch('/ai-settings', authenticate, validate(aiSettingsSchema), authController.updateAISettings);
router.get('/ai-settings/credits', authenticate, authController.getAICreditStatus);
const trainingUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, file.originalname.toLowerCase().endsWith('.txt')) });
router.post('/ai-settings/training', authenticate, trainingUpload.single('file'), authController.uploadChatTraining);

export default router;
