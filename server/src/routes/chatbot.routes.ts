import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller';
import * as knowledgeController from '../controllers/knowledge.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── Public Widget Endpoints (CORS handled globally — open to all origins) ──
router.options('/message', (req, res) => res.sendStatus(204));
router.post('/message', chatbotController.handleWidgetMessage);
router.get('/status/:chatbotId', chatbotController.getChatbotStatus);

// ── Dashboard Endpoints (require auth) ──────────────────────────────────────────
router.use(authenticate);

router.get('/', chatbotController.getChatbot);
router.put('/', chatbotController.updateChatbot);

// Leads
router.get('/leads', chatbotController.listLeads);
router.post('/leads/:id/reply', chatbotController.replyToLead);
router.delete('/leads/:id', chatbotController.deleteLead);

// ── Company Knowledge ─────────────────────────────────────────────────────────
router.get('/knowledge', knowledgeController.listKnowledge);
router.post('/knowledge', knowledgeController.createKnowledge);
router.post('/knowledge/test', knowledgeController.testKnowledgeQuery);
router.patch('/knowledge/:id', knowledgeController.updateKnowledge);
router.delete('/knowledge/:id', knowledgeController.deleteKnowledge);

export default router;

