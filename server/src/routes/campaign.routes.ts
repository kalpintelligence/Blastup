import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: List all campaigns
 *     tags: [Campaigns]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of campaigns
 *   post:
 *     summary: Create and schedule a bulk campaign
 *     tags: [Campaigns]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, templateText, scheduledAt]
 *             properties:
 *               name:
 *                 type: string
 *               templateText:
 *                 type: string
 *               mediaUrl:
 *                 type: string
 *               interactiveType:
 *                 type: string
 *                 enum: [none, button, slider]
 *               buttons:
 *                 type: array
 *                 items:
 *                   type: object
 *               sliderItems:
 *                 type: array
 *                 items:
 *                   type: object
 *               targetGroups:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.get('/', campaignController.listCampaigns);
router.post('/', campaignController.createCampaign);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get details of a specific campaign
 *     tags: [Campaigns]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign object
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Campaigns]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 */
router.get('/:id', campaignController.getCampaign);
router.delete('/:id', campaignController.deleteCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/logs:
 *   get:
 *     summary: Get recipient delivery logs for campaign analytics
 *     tags: [Campaigns]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, sent, delivered, read, failed]
 *     responses:
 *       200:
 *         description: List of recipient logs
 */
router.get('/:id/logs', campaignController.getCampaignLogs);

/**
 * @swagger
 * /api/campaigns/{id}/recampaign:
 *   post:
 *     summary: Launch a follow-up re-campaign to a filtered recipient status subset
 *     tags: [Campaigns]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filterStatus, scheduledAt]
 *             properties:
 *               name:
 *                 type: string
 *               filterStatus:
 *                 type: string
 *                 enum: [sent, delivered, read, unread, failed]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Re-campaign created and scheduled successfully
 */
router.post('/:id/recampaign', campaignController.reCampaign);

export default router;
