import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ChatbotKnowledge } from '../models/ChatbotKnowledge';
import { Chatbot } from '../models/Chatbot';
import * as knowledgeEngine from '../services/knowledgeEngine';

// ─── LIST ─────────────────────────────────────────────────────────────────────

export async function listKnowledge(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { category, status, search } = req.query as Record<string, string>;

    const filter: Record<string, any> = { instanceId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    const items = await ChatbotKnowledge.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createKnowledge(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { title, category, content, keywords, synonyms, priority, status } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Title and content are required' });
      return;
    }

    const item = await ChatbotKnowledge.create({
      instanceId,
      title: String(title).trim(),
      category: String(category || 'Other').trim(),
      content: String(content).trim(),
      keywords: Array.isArray(keywords)
        ? keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean)
        : [],
      synonyms: Array.isArray(synonyms)
        ? synonyms.map((s: string) => s.toLowerCase().trim()).filter(Boolean)
        : [],
      priority: Number(priority) || 5,
      status: status === 'inactive' ? 'inactive' : 'active',
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateKnowledge(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { id } = req.params;
    const { title, category, content, keywords, synonyms, priority, status } = req.body;

    const update: Record<string, any> = {};
    if (title !== undefined) update.title = String(title).trim();
    if (category !== undefined) update.category = String(category).trim();
    if (content !== undefined) update.content = String(content).trim();
    if (keywords !== undefined)
      update.keywords = Array.isArray(keywords)
        ? keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean)
        : [];
    if (synonyms !== undefined)
      update.synonyms = Array.isArray(synonyms)
        ? synonyms.map((s: string) => s.toLowerCase().trim()).filter(Boolean)
        : [];
    if (priority !== undefined) update.priority = Number(priority);
    if (status !== undefined) update.status = status;

    const item = await ChatbotKnowledge.findOneAndUpdate(
      { _id: id, instanceId },
      { $set: update },
      { new: true }
    );

    if (!item) {
      res.status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteKnowledge(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { id } = req.params;

    const item = await ChatbotKnowledge.findOneAndDelete({ _id: id, instanceId });
    if (!item) {
      res.status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── TEST QUERY ───────────────────────────────────────────────────────────────
// Admin-only: run the matching engine against a test message

export async function testKnowledgeQuery(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { message, sessionId } = req.body as { message: string; sessionId?: string };

    if (!message) {
      res.status(400).json({ success: false, error: 'message is required' });
      return;
    }

    const [allItems, chatbot] = await Promise.all([
      ChatbotKnowledge.find({ instanceId, status: 'active' }).lean(),
      Chatbot.findOne({ instanceId }).lean(),
    ]);

    const fallback =
      chatbot?.fallbackMessage ||
      "I don't have that information right now. I can help with our products, pricing, or services.";

    const sid = sessionId || `test_${instanceId}_${Date.now()}`;
    const result = await knowledgeEngine.query(message, allItems as any, sid, fallback);

    res.json({
      success: true,
      data: {
        message,
        reply: result.reply,
        intent: result.intent,
        confidence: result.confidence,
        knowledgeId: result.knowledgeId,
        knowledgeTitle: result.knowledgeTitle,
        suggestions: result.suggestions,
      },
    });
  } catch (err) {
    next(err);
  }
}
