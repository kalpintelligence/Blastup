import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Chatbot } from '../models/Chatbot';
import { ChatbotLead } from '../models/ChatbotLead';
import { ChatbotKnowledge } from '../models/ChatbotKnowledge';
import * as knowledgeEngine from '../services/knowledgeEngine';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

export async function getChatbot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    let chatbot = await Chatbot.findOne({ instanceId }).lean();

    if (!chatbot) {
      chatbot = {
        instanceId,
        enabled: false,
        botName: 'Blastup Bot',
        botIcon: 'bot',
        welcomeMessage: 'Hello! Welcome. How can I help you today? 👋',
        fallbackMessage: "Thanks for reaching out! 🚀 Share your details or ask a question and our team will connect with you right away.",
        offlineMessage: "We're currently offline. Please leave your contact details and we'll get back to you shortly.",
        headerText: 'Chat with us',
        subHeaderText: 'We typically reply within minutes',
        buttonLabel: 'Chat',
        primaryColor: '#25D366',
        secondaryColor: '#128C7E',
        gradient: true,
        gradientAngle: 135,
        position: 'bottom-right',
        theme: 'glassmorphic',
        whitelistedDomains: [],
        rules: [],
        collectLeads: false,
        leadFields: ['name', 'email'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    res.json({ success: true, data: chatbot });
  } catch (err) {
    next(err);
  }
}

export async function updateChatbot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const {
      enabled, botName, botIcon, welcomeMessage, fallbackMessage, offlineMessage,
      headerText, subHeaderText, buttonLabel,
      primaryColor, secondaryColor, gradient, gradientAngle, position, theme,
      whitelistedDomains, rules, collectLeads, leadFields,
    } = req.body;

    const chatbot = await Chatbot.findOneAndUpdate(
      { instanceId },
      {
        $set: {
          enabled: enabled !== undefined ? enabled : false,
          botName: botName || 'Blastup Bot',
          botIcon: botIcon || 'bot',
          welcomeMessage: welcomeMessage || 'Hello! Welcome. How can I help you today? 👋',
          fallbackMessage: fallbackMessage || "Sorry, I didn't understand that.",
          offlineMessage: offlineMessage || "We're currently offline.",
          headerText: headerText || 'Chat with us',
          subHeaderText: subHeaderText || 'We typically reply within minutes',
          buttonLabel: buttonLabel || 'Chat',
          primaryColor: primaryColor || '#25D366',
          secondaryColor: secondaryColor || '#128C7E',
          gradient: gradient !== undefined ? gradient : true,
          gradientAngle: gradientAngle !== undefined ? Number(gradientAngle) : 135,
          position: position || 'bottom-right',
          theme: theme || 'glassmorphic',
          whitelistedDomains: Array.isArray(whitelistedDomains) ? whitelistedDomains : [],
          rules: rules || [],
          collectLeads: collectLeads !== undefined ? collectLeads : false,
          leadFields: Array.isArray(leadFields) ? leadFields : ['name', 'email'],
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: chatbot });
  } catch (err) {
    next(err);
  }
}

export async function handleWidgetMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, url, sessionId, capturedData } = req.body;
    let origin = req.headers.origin || req.headers.referer;

    if (origin === 'null') {
      origin = undefined;
    }

    // Clean up origin — extract hostname
    if (origin) {
      try {
        const originUrl = new URL(origin);
        origin = originUrl.hostname;
      } catch {
        // Leave as is
      }
    }

    if (!origin && url) {
      if (url.startsWith('file://')) {
        origin = 'localhost';
      } else {
        try {
          const parsedUrl = new URL(url);
          origin = parsedUrl.hostname;
        } catch {
          // Leave as is
        }
      }
    }

    if (!origin) {
      res.status(401).json({ success: false, error: 'Unauthorized', message: 'No valid origin found' });
      return;
    }

    // Find a chatbot configuration that has this origin in its whitelisted domains
    const chatbot = await Chatbot.findOne({
      enabled: true,
      whitelistedDomains: { $in: [origin] }
    }).lean();

    if (!chatbot) {
      res.status(401).json({ success: false, error: 'Unauthorized', message: 'Domain not whitelisted or chatbot disabled' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Bad Request', message: 'Message is required' });
      return;
    }

    const msg = message.toLowerCase().trim();
    let reply = chatbot.fallbackMessage || "Thanks for reaching out! 🚀 Share your details or ask a question and our team will connect with you right away.";

    // Check for common greetings
    const isGreeting = /^(hey|hi|hello|hola|hey there|good morning|good afternoon|good evening|yo|hlo)\b/i.test(msg);
    let matchedRule = false;

    // Evaluate rules
    if (chatbot.rules && chatbot.rules.length > 0) {
      for (const rule of chatbot.rules) {
        if (!rule.keyword) continue;
        const kw = rule.keyword.toLowerCase().trim();
        let matched = false;

        if (rule.matchType === 'exact' && msg === kw) matched = true;
        else if (rule.matchType === 'startsWith' && msg.startsWith(kw)) matched = true;
        else if (rule.matchType === 'contains' && msg.includes(kw)) matched = true;

        if (matched) {
          reply = rule.response;
          matchedRule = true;
          break;
        }
      }
    }

    if (!matchedRule && isGreeting) {
      reply = "Hello! 👋 Thanks for reaching out. How can we help you today? Feel free to ask any question or leave your contact details so our team can connect with you!";
    }

    // ── Knowledge Engine ─────────────────────────────────────────────────────
    // If no rule matched and not a simple greeting, query knowledge base
    if (!matchedRule && !isGreeting) {
      try {
        const knowledgeItems = await ChatbotKnowledge.find({
          instanceId: (chatbot as any).instanceId,
          status: 'active',
        }).lean();

        if (knowledgeItems.length > 0) {
          const knowledgeResult = await knowledgeEngine.query(
            message,
            knowledgeItems as any,
            sessionId || `anon_${Date.now()}`,
            chatbot.fallbackMessage
          );

          if (knowledgeResult.confidence >= 0.40) {
            reply = knowledgeResult.reply;
          }
        }
      } catch {
        // Non-fatal: fall through to default fallback
      }
    }

    // Persist lead data if collectLeads is enabled and we have a sessionId
    if (chatbot.collectLeads && sessionId) {
      try {
        const now = new Date();
        await ChatbotLead.findOneAndUpdate(
          { instanceId: (chatbot as any).instanceId, sessionId },
          {
            $setOnInsert: {
              instanceId: (chatbot as any).instanceId,
              sessionId,
              domain: origin,
              pageUrl: url || '',
              capturedData: capturedData || {},
            },
            $push: {
              messages: {
                $each: [
                  { sender: 'user', text: message, timestamp: now },
                  { sender: 'bot', text: reply, timestamp: new Date(now.getTime() + 1) },
                ],
              },
            },
          },
          { upsert: true }
        );
      } catch {
        // Non-fatal — don't fail the message if lead storage fails
      }
    }

    res.json({
      success: true,
      data: { reply }
    });
  } catch (err) {
    next(err);
  }
}

export async function listLeads(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { page, limit, skip } = parsePagination(req.query);
    const domain = req.query.domain as string | undefined;

    const filter: Record<string, any> = { instanceId };
    if (domain) filter.domain = domain;

    const [data, total] = await Promise.all([
      ChatbotLead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ChatbotLead.countDocuments(filter),
    ]);

    res.json(buildPaginatedResult(data, total, { page, limit, skip }));
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { id } = req.params;
    await ChatbotLead.findOneAndDelete({ _id: id, instanceId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
