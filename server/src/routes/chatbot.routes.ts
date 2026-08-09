import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller';
import * as knowledgeController from '../controllers/knowledge.controller';
import { authenticate } from '../middleware/auth';
import cors from 'cors';

const router = Router();

// ── Public Widget Endpoints (CORS open, domain whitelist enforced in controller) ──
router.options('/message', cors({ origin: '*' }));
router.post('/message', cors({ origin: '*' }), chatbotController.handleWidgetMessage);

// ── Dashboard Endpoints (require auth) ──────────────────────────────────────────
router.use(authenticate);

router.get('/', chatbotController.getChatbot);
router.put('/', chatbotController.updateChatbot);

// Leads
router.get('/leads', chatbotController.listLeads);
router.delete('/leads/:id', chatbotController.deleteLead);

// ── Company Knowledge ─────────────────────────────────────────────────────────
router.get('/knowledge', knowledgeController.listKnowledge);
router.post('/knowledge', knowledgeController.createKnowledge);
router.post('/knowledge/test', knowledgeController.testKnowledgeQuery);
router.patch('/knowledge/:id', knowledgeController.updateKnowledge);
router.delete('/knowledge/:id', knowledgeController.deleteKnowledge);

export default router;

