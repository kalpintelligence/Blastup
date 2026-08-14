import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller';
import * as knowledgeController from '../controllers/knowledge.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── Public Widget Endpoints (CORS handled globally — open to all origins) ──
router.options('/message', (req, res) => res.sendStatus(204));

/**
 * @swagger
 * /api/chatbot/message:
 *   post:
 *     summary: Public widget message endpoint
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatbotId, message]
 *             properties:
 *               chatbotId:
 *                 type: string
 *                 description: Unique Chatbot configuration ID
 *               message:
 *                 type: string
 *                 description: Incoming message from visitor
 *               sessionId:
 *                 type: string
 *                 description: Unique visitor session identifier
 *               url:
 *                 type: string
 *                 description: Current page URL
 *               capturedData:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Chatbot response message
 */
router.post('/message', chatbotController.handleWidgetMessage);

/**
 * @swagger
 * /api/chatbot/status/{chatbotId}:
 *   get:
 *     summary: Get public chatbot status
 *     tags: [Chatbot]
 *     parameters:
 *       - in: path
 *         name: chatbotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chatbot configuration ID
 *     responses:
 *       200:
 *         description: Chatbot status and online indicator
 */
router.get('/status/:chatbotId', chatbotController.getChatbotStatus);

// ── Dashboard Endpoints (require auth) ──────────────────────────────────────────
router.use(authenticate);

/**
 * @swagger
 * /api/chatbot:
 *   get:
 *     summary: Get active Chatbot configuration & No-Code flows
 *     tags: [Chatbot]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Chatbot configuration including visual flow nodes and replySource
 */
router.get('/', chatbotController.getChatbot);

/**
 * @swagger
 * /api/chatbot:
 *   put:
 *     summary: Update Chatbot configuration & No-Code visual flows
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
 *                 description: Enable or disable auto-replies
 *                 example: true
 *               replySource:
 *                 type: string
 *                 enum: [nocode, standard, off]
 *                 description: Active reply engine mode (nocode flow vs standard rules)
 *                 example: "nocode"
 *               botName:
 *                 type: string
 *                 example: "Urban Studioz Bot"
 *               primaryColor:
 *                 type: string
 *                 example: "#16a34a"
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
 *               flows:
 *                 type: array
 *                 description: Visual No-Code flow nodes with triggers, buttons, and branch routing
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "node-media"
 *                     type:
 *                       type: string
 *                       enum: [flowStart, mediaButtons, message, requestIntervention]
 *                     title:
 *                       type: string
 *                       example: "Welcome Menu"
 *                     content:
 *                       type: string
 *                       example: "Welcome to our store! Choose an option below:"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
 *                     triggers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Hi", "Hello", "Menu"]
 *                     buttons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           label:
 *                             type: string
 *                             example: "🛍️ Shop Collections"
 *                           targetNodeId:
 *                             type: string
 *                             example: "node-catalog"
 *     responses:
 *       200:
 *         description: Updated chatbot configuration
 */
router.put('/', chatbotController.updateChatbot);

/**
 * @swagger
 * /api/chatbot/leads:
 *   get:
 *     summary: List captured customer leads from Chatbot
 *     tags: [Chatbot Leads]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of captured customer leads
 */
router.get('/leads', chatbotController.listLeads);

/**
 * @swagger
 * /api/chatbot/leads/{id}/reply:
 *   post:
 *     summary: Send direct WhatsApp reply to a captured lead
 *     tags: [Chatbot Leads]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Hello! We received your inquiry and are happy to help."
 *     responses:
 *       200:
 *         description: Reply sent to lead on WhatsApp
 */
router.post('/leads/:id/reply', chatbotController.replyToLead);

/**
 * @swagger
 * /api/chatbot/leads/{id}:
 *   delete:
 *     summary: Delete a captured lead
 *     tags: [Chatbot Leads]
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
 *         description: Lead deleted successfully
 */
router.delete('/leads/:id', chatbotController.deleteLead);

// ── Company Knowledge ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/chatbot/knowledge:
 *   get:
 *     summary: List company knowledge items for AI matching
 *     tags: [Chatbot Knowledge]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: List of knowledge items
 */
router.get('/knowledge', knowledgeController.listKnowledge);

/**
 * @swagger
 * /api/chatbot/knowledge:
 *   post:
 *     summary: Create new company knowledge entry
 *     tags: [Chatbot Knowledge]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Return & Refund Policy"
 *               category:
 *                 type: string
 *                 example: "Refunds"
 *               content:
 *                 type: string
 *                 example: "We provide 7-day hassle-free returns with original tags."
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["return", "refund", "exchange"]
 *               synonyms:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: integer
 *                 default: 5
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *     responses:
 *       201:
 *         description: Knowledge entry created
 */
router.post('/knowledge', knowledgeController.createKnowledge);

/**
 * @swagger
 * /api/chatbot/knowledge/test:
 *   post:
 *     summary: Test AI knowledge query matching
 *     tags: [Chatbot Knowledge]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What is your return policy?"
 *     responses:
 *       200:
 *         description: Knowledge match test result with confidence score
 */
router.post('/knowledge/test', knowledgeController.testKnowledgeQuery);

/**
 * @swagger
 * /api/chatbot/knowledge/{id}:
 *   patch:
 *     summary: Update company knowledge entry
 *     tags: [Chatbot Knowledge]
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
 *     responses:
 *       200:
 *         description: Knowledge entry updated
 */
router.patch('/knowledge/:id', knowledgeController.updateKnowledge);

/**
 * @swagger
 * /api/chatbot/knowledge/{id}:
 *   delete:
 *     summary: Delete company knowledge entry
 *     tags: [Chatbot Knowledge]
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
 *         description: Knowledge entry deleted
 */
router.delete('/knowledge/:id', knowledgeController.deleteKnowledge);

export default router;
