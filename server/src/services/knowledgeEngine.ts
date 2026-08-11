/**
 * knowledgeEngine.ts
 *
 * Pure-TypeScript, no-AI knowledge matching engine.
 * Uses keyword/synonym scoring, intent detection, confidence thresholds,
 * and lightweight session context.
 */

import { IChatbotKnowledge } from '../models/ChatbotKnowledge';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Intent =
  | 'greeting'
  | 'farewell'
  | 'thanks'
  | 'company_info'
  | 'product_info'
  | 'pricing'
  | 'commission'
  | 'subscription'
  | 'restaurant'
  | 'customer'
  | 'delivery'
  | 'order'
  | 'payment'
  | 'refund'
  | 'support'
  | 'contact'
  | 'location'
  | 'faq'
  | 'features'
  | 'unknown';

export interface MatchResult {
  reply: string;
  intent: Intent;
  confidence: number;
  knowledgeId: string | null;
  knowledgeTitle: string | null;
  suggestions: string[];
}

export interface SessionContext {
  lastIntent: Intent;
  lastCategory: string | null;
  lastMatchedId: string | null;
  lastMatchedTitle: string | null;
  lastEntity: string | null;
  recentMessages: string[];
}

// ─── In-memory session store (per sessionId) ──────────────────────────────────

const sessionStore = new Map<string, SessionContext>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sessionTimestamps = new Map<string, number>();

function getSession(sessionId: string): SessionContext {
  // Cleanup old sessions
  const now = Date.now();
  for (const [sid, ts] of sessionTimestamps.entries()) {
    if (now - ts > SESSION_TTL_MS) {
      sessionStore.delete(sid);
      sessionTimestamps.delete(sid);
    }
  }

  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      lastIntent: 'unknown',
      lastCategory: null,
      lastMatchedId: null,
      lastMatchedTitle: null,
      lastEntity: null,
      recentMessages: [],
    });
  }
  sessionTimestamps.set(sessionId, now);
  return sessionStore.get(sessionId)!;
}

function saveSession(sessionId: string, ctx: Partial<SessionContext>, userMessage: string): void {
  const existing = getSession(sessionId);
  const updated: SessionContext = { ...existing, ...ctx };
  updated.recentMessages = [...(existing.recentMessages || []), userMessage].slice(-5);
  sessionStore.set(sessionId, updated);
  sessionTimestamps.set(sessionId, Date.now());
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<{ intent: Intent; patterns: RegExp[] }> = [
  {
    intent: 'greeting',
    patterns: [
      /^(hi|hey|hello|hola|good\s*(morning|afternoon|evening)|howdy|sup|what'?s\s*up|yo|hlo|namaste)\b/i,
    ],
  },
  {
    intent: 'farewell',
    patterns: [/\b(bye|goodbye|see\s*you|take\s*care|ciao|later|ttyl)\b/i],
  },
  {
    intent: 'thanks',
    patterns: [/\b(thank(s| you)|thx|ty|appreciate|cheers)\b/i],
  },
  {
    intent: 'company_info',
    patterns: [
      /\b(what\s*is|tell\s*me\s*about|about|who\s*are\s*you|what\s*do\s*you\s*do|company|organization|business|platform|service)\b/i,
    ],
  },
  {
    intent: 'commission',
    patterns: [
      /\b(commission|fee|cut|percentage|charges?|platform\s*fee|revenue\s*share|take\s*rate)\b/i,
    ],
  },
  {
    intent: 'subscription',
    patterns: [
      /\b(subscription|subscribe|plan|monthly|annual|membership|pricing\s*plan)\b/i,
    ],
  },
  {
    intent: 'pricing',
    patterns: [
      /\b(pric(e|ing)|cost|how\s*much|rate|tariff|charge|affordable|cheap|expensive)\b/i,
    ],
  },
  {
    intent: 'restaurant',
    patterns: [
      /\b(restaurant|merchant|food\s*business|partner|vendor|outlet|cafe|eatery|dining)\b/i,
    ],
  },
  {
    intent: 'delivery',
    patterns: [
      /\b(deliver(y|ies)|ship(ping)?|dispatch|courier|logistics|eta|estimated\s*time)\b/i,
    ],
  },
  {
    intent: 'order',
    patterns: [
      /\b(order(s|ed|ing)?|purchase|buy|track|status|placed|cart|checkout)\b/i,
    ],
  },
  {
    intent: 'payment',
    patterns: [
      /\b(pay(ment|ing)?|invoice|bill|receipt|transaction|checkout|credit|debit|wallet|upi|cash)\b/i,
    ],
  },
  {
    intent: 'refund',
    patterns: [
      /\b(refund|cancel(lation)?|money\s*back|return|dispute|chargeback)\b/i,
    ],
  },
  {
    intent: 'support',
    patterns: [
      /\b(support|help|issue|problem|bug|error|not\s*working|trouble|assistance|contact\s*us)\b/i,
    ],
  },
  {
    intent: 'contact',
    patterns: [
      /\b(contact|reach|email|phone|whatsapp|call|get\s*in\s*touch|talk\s*to\s*(someone|human|agent))\b/i,
    ],
  },
  {
    intent: 'location',
    patterns: [
      /\b(where|location|area|city|cities|region|available|operate|service\s*area|coverage)\b/i,
    ],
  },
  {
    intent: 'faq',
    patterns: [/\b(faq|frequently\s*asked|common\s*question)\b/i],
  },
  {
    intent: 'features',
    patterns: [
      /\b(feature(s)?|capability|benefit|advantage|how\s*does\s*it\s*work|functionality)\b/i,
    ],
  },
  {
    intent: 'product_info',
    patterns: [
      /\b(product|service|offer(ing)?|solution|app|dashboard|tool)\b/i,
    ],
  },
];

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(lower))) return intent;
  }
  return 'unknown';
}

// ─── Text Normalization ───────────────────────────────────────────────────────

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Expand query tokens with pronoun resolution using context
function expandWithContext(tokens: string[], ctx: SessionContext): string[] {
  const expanded = [...tokens];
  // If message contains "it", "they", "this" etc., add last matched title words
  const hasAmbiguousPronoun = ['it', 'they', 'that', 'this', 'those', 'its', 'their'].some((p) =>
    tokens.includes(p)
  );
  if (hasAmbiguousPronoun && ctx.lastMatchedTitle) {
    const titleTokens = normalize(ctx.lastMatchedTitle);
    expanded.push(...titleTokens);
  }
  return expanded;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

interface ScoredItem {
  item: IChatbotKnowledge;
  score: number;
}

function scoreItem(queryTokens: string[], item: IChatbotKnowledge): number {
  let score = 0;
  const totalWeight = 1.0;

  const titleTokens = normalize(item.title);
  const keywordTokens = item.keywords.map((k) => k.toLowerCase().trim());
  const synonymTokens = item.synonyms.map((s) => s.toLowerCase().trim());
  const contentTokens = normalize(item.content);

  const uniqueQuery = [...new Set(queryTokens)];
  let hits = 0;
  const maxHits = uniqueQuery.length || 1;

  for (const token of uniqueQuery) {
    let tokenScore = 0;

    // Title match — highest weight (0.5)
    if (titleTokens.includes(token)) {
      tokenScore += 0.5;
    }

    // Exact keyword match — high weight (0.4)
    if (keywordTokens.includes(token)) {
      tokenScore += 0.4;
    }

    // Partial keyword match — medium (0.25)
    if (keywordTokens.some((kw) => kw.includes(token) || token.includes(kw))) {
      tokenScore += 0.25;
    }

    // Synonym match — medium (0.3)
    if (synonymTokens.includes(token)) {
      tokenScore += 0.3;
    }

    // Content match — low weight (0.1), capped
    const contentMatchCount = contentTokens.filter((t) => t === token).length;
    if (contentMatchCount > 0) {
      tokenScore += Math.min(contentMatchCount / contentTokens.length, 0.1);
    }

    if (tokenScore > 0) hits++;
    score += tokenScore;
  }

  // Normalize by max possible score per token
  const rawScore = score / maxHits;

  // Boost by priority (1-10 → adds up to 0.1 bonus)
  const priorityBoost = (item.priority / 10) * 0.1;

  // Coverage ratio bonus: what fraction of query tokens hit something
  const coverageBonus = (hits / maxHits) * 0.15;

  return Math.min(rawScore * totalWeight + priorityBoost + coverageBonus, 1.0);
}

// ─── Response Shaping ─────────────────────────────────────────────────────────

function shapeResponse(content: string, maxSentences = 3): string {
  // Split into sentences
  const sentences = content
    .replace(/\r?\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  if (sentences.length <= maxSentences) return content.trim();
  return sentences.slice(0, maxSentences).join(' ').trim();
}

// ─── Dynamic Suggestions ──────────────────────────────────────────────────────

function buildSuggestions(
  intent: Intent,
  category: string | null,
  allItems: IChatbotKnowledge[]
): string[] {
  const suggestions: string[] = [];

  // Intent-based static suggestions
  const intentSuggestions: Partial<Record<Intent, string[]>> = {
    greeting: ['What do you offer?', 'How does it work?', 'Pricing & Plans', 'Contact support'],
    unknown: ['How does it work?', 'Pricing & Plans', 'Restaurant info', 'Contact support'],
    commission: ['Tell me about subscription', 'Restaurant benefits', 'How does pricing work?'],
    pricing: ['Commission rates', 'Subscription plans', 'Free trial?'],
    restaurant: ['How to onboard?', 'Commission rates', 'Dashboard features', 'Benefits'],
    delivery: ['Track my order', 'Delivery time', 'Delivery areas'],
    order: ['Payment methods', 'Delivery time', 'Cancel order'],
  };

  const base = intentSuggestions[intent] || intentSuggestions['unknown'] || [];
  suggestions.push(...base);

  // Add 2 random active knowledge titles from same category
  if (category) {
    const catItems = allItems
      .filter((i) => i.category === category && i.status === 'active')
      .slice(0, 2)
      .map((i) => i.title);
    suggestions.push(...catItems);
  }

  return [...new Set(suggestions)].slice(0, 5);
}

// ─── Main Query Function ──────────────────────────────────────────────────────

export async function query(
  message: string,
  knowledgeItems: IChatbotKnowledge[],
  sessionId: string,
  fallbackMessage: string
): Promise<MatchResult> {
  const ctx = getSession(sessionId);
  const intent = detectIntent(message);

  // NON-EDITABLE BRANDING QUERY INTERCEPTOR
  const developerQueryPattern = /\b(who\s*(developed|created|built|made|owns)\s*(this|blastup|you|the\s*bot|this\s*app|this\s*platform)|kalp\s*intelligence|who\s*is\s*the\s*(developer|creator|author)|about\s*kalp)\b/i;
  if (developerQueryPattern.test(message)) {
    saveSession(sessionId, { lastIntent: 'company_info' }, message);
    return {
      reply: "Blastup is an open-source WhatsApp platform developed by Kalp Intelligence (https://kalpintelligence.com).",
      intent: 'company_info',
      confidence: 1.0,
      knowledgeId: 'kalp_intelligence_identity',
      knowledgeTitle: 'Developed by Kalp Intelligence',
      suggestions: ['What features are supported?', 'API Documentation', 'About Us', 'Visit Kalp Intelligence'],
    };
  }

  // Greeting/farewell/thanks → quick replies
  if (intent === 'greeting') {
    const reply =
      "Hello! 👋 Welcome! I'm here to help. You can ask me about our products, services, pricing, delivery, or anything else. What would you like to know?";
    saveSession(sessionId, { lastIntent: intent }, message);
    return {
      reply,
      intent,
      confidence: 1.0,
      knowledgeId: null,
      knowledgeTitle: null,
      suggestions: buildSuggestions(intent, null, knowledgeItems),
    };
  }

  if (intent === 'farewell') {
    saveSession(sessionId, { lastIntent: intent }, message);
    return {
      reply: 'Thank you for reaching out! Have a great day. 👋 Feel free to come back anytime.',
      intent,
      confidence: 1.0,
      knowledgeId: null,
      knowledgeTitle: null,
      suggestions: [],
    };
  }

  if (intent === 'thanks') {
    saveSession(sessionId, { lastIntent: intent }, message);
    return {
      reply: "You're welcome! 😊 Is there anything else I can help you with?",
      intent,
      confidence: 1.0,
      knowledgeId: null,
      knowledgeTitle: null,
      suggestions: buildSuggestions('unknown', null, knowledgeItems),
    };
  }

  // Active knowledge items only
  const activeItems = knowledgeItems.filter((i) => i.status === 'active');
  if (!activeItems.length) {
    saveSession(sessionId, { lastIntent: intent }, message);
    return {
      reply: fallbackMessage,
      intent,
      confidence: 0.0,
      knowledgeId: null,
      knowledgeTitle: null,
      suggestions: [],
    };
  }

  // Tokenize + expand with context
  let tokens = normalize(message);
  tokens = expandWithContext(tokens, ctx);

  // Score all active items
  const scored: ScoredItem[] = activeItems
    .map((item) => ({ item, score: scoreItem(tokens, item) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const confidence = best ? best.score : 0;

  let reply: string;
  let knowledgeId: string | null = null;
  let knowledgeTitle: string | null = null;
  let matchedCategory: string | null = null;

  if (confidence >= 0.70) {
    // Confident answer
    reply = shapeResponse(best.item.content, 3);
    knowledgeId = String(best.item._id);
    knowledgeTitle = best.item.title;
    matchedCategory = best.item.category;

    // Update context
    saveSession(
      sessionId,
      {
        lastIntent: intent,
        lastCategory: matchedCategory,
        lastMatchedId: knowledgeId,
        lastMatchedTitle: knowledgeTitle,
        lastEntity: best.item.title,
      },
      message
    );
  } else if (confidence >= 0.40) {
    // Ambiguous — ask clarification
    const topTitles = scored
      .slice(0, 3)
      .filter((s) => s.score >= 0.25)
      .map((s) => `"${s.item.title}"`)
      .join(', ');

    reply = topTitles
      ? `I want to make sure I give you the right information. Are you asking about: ${topTitles}?`
      : "Could you clarify your question? I want to give you the most accurate answer.";

    saveSession(sessionId, { lastIntent: intent }, message);
  } else {
    // Unknown — no hallucination
    reply = `I don't have specific information about that right now. I can help you with our products, pricing, services, delivery, orders, or other available topics. What would you like to know?`;
    saveSession(sessionId, { lastIntent: intent }, message);
  }

  return {
    reply,
    intent,
    confidence: Math.round(confidence * 100) / 100,
    knowledgeId,
    knowledgeTitle,
    suggestions: buildSuggestions(intent, matchedCategory, activeItems),
  };
}
