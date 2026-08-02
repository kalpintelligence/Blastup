import { Router } from 'express';
import * as apiKeyController from '../controllers/apikey.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: List all API keys
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/', apiKeyController.listApiKeys);

/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: API key created (returns raw key once)
 */
router.post('/', validate(createKeySchema), apiKeyController.createApiKey);

/**
 * @swagger
 * /api/keys/{id}:
 *   delete:
 *     summary: Delete an API key
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted
 */
router.delete('/:id', apiKeyController.deleteApiKey);

export default router;
