import { Router } from 'express';
import * as contactController from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/contacts/groups:
 *   get:
 *     summary: Get distinct contact groups with count
 *     tags: [Contacts]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get('/groups', contactController.getGroups);

/**
 * @swagger
 * /api/contacts/groups/update:
 *   post:
 *     summary: Assign or remove groups from contacts
 *     tags: [Contacts]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jids, groups]
 *             properties:
 *               jids:
 *                 type: array
 *                 items:
 *                   type: string
 *               groups:
 *                 type: array
 *                 items:
 *                   type: string
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *     responses:
 *       200:
 *         description: Groups updated
 */
router.post('/groups/update', contactController.updateContactGroups);

/**
 * @swagger
 * /api/contacts/import:
 *   post:
 *     summary: Bulk import contacts with group assignment
 *     tags: [Contacts]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contacts]
 *             properties:
 *               groups:
 *                 type: array
 *                 items:
 *                   type: string
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [phone]
 *                   properties:
 *                     phone:
 *                       type: string
 *                     name:
 *                       type: string
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Import status summary
 */
router.post('/import', contactController.importContacts);

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
 *       - in: query
 *         name: group
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
 *   patch:
 *     summary: Update a contact's name or groups
 *     tags: [Contacts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               groups:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated contact
 *   delete:
 *     summary: Delete a contact
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
 *         description: Contact deleted
 */
router.get('/:jid', contactController.getContact);
router.patch('/:jid', contactController.updateContact);
router.delete('/:jid', contactController.deleteContact);

export default router;

