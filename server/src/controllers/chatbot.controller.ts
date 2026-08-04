import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Chatbot } from '../models/Chatbot';

export async function getChatbot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    let chatbot = await Chatbot.findOne({ instanceId }).lean();
    if (!chatbot) {
      // Return default config
      chatbot = {
        _id: null,
        instanceId,
        enabled: false,
        welcomeMessage: 'Hello! Welcome. How can I help you today?',
        fallbackMessage: "Sorry, I didn't understand that. Please type 'help' to see what I can do.",
        rules: [],
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
    const { enabled, welcomeMessage, fallbackMessage, position, primaryColor, rules } = req.body;

    const chatbot = await Chatbot.findOneAndUpdate(
      { instanceId },
      {
        $set: {
          enabled: enabled !== undefined ? enabled : false,
          welcomeMessage: welcomeMessage || 'Hello! Welcome. How can I help you today?',
          fallbackMessage: fallbackMessage || "Sorry, I didn't understand that.",
          position: position || 'bottom-right',
          primaryColor: primaryColor || '#25D366',
          rules: rules || [],
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: chatbot });
  } catch (err) {
    next(err);
  }
}
