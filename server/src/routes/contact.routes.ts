import { Router } from 'express';
import * as contactController from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: List all synced contacts
 *     tags: [Contacts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of contacts
 */
router.get('/', contactController.getContacts);

/**
 * @swagger
 * /api/contacts/{jid}:
 *   get:
 *     summary: Get a specific contact by JID
 *     tags: [Contacts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact details
 */
router.get('/:jid', contactController.getContact);

export default router;
