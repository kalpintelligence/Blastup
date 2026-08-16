import { Request, Response, NextFunction } from 'express';
import { loginUser, logoutUser, registerUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { writeLog } from '../services/log.service';
import { env } from '../config/env';
import { User } from '../models/User';
import { encrypt } from '../utils/crypto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  path: '/',
};

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await loginUser({ username, password, ip, userAgent });

    res.cookie('wa_token', result.token, COOKIE_OPTIONS);

    await writeLog({
      level: 'info',
      category: 'auth',
      message: 'User logged in',
      userId: result.user.id,
      ip,
      userAgent,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: result.user },
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone, password } = req.body;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await registerUser({ email, phone, password, ip, userAgent });

    res.cookie('wa_token', result.token, COOKIE_OPTIONS);

    await writeLog({
      level: 'info',
      category: 'auth',
      message: `New user registered: ${email}`,
      userId: result.user.id,
      ip,
      userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: result.user },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.wa_token;
    if (token) {
      await logoutUser(token);
    }

    res.clearCookie('wa_token', { path: '/' });

    await writeLog({
      level: 'info',
      category: 'auth',
      message: 'User logged out',
      userId: req.user?.id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          lastLoginIp: user.lastLoginIp,
          createdAt: user.createdAt,
          openaiConfigured: !!user.openaiKeyLast4,
          openaiKeyLast4: user.openaiKeyLast4,
          geminiConfigured: !!user.geminiKeyLast4,
          geminiKeyLast4: user.geminiKeyLast4,
          aiProvider: user.aiProvider,
          aiAutomationEnabled: user.aiAutomationEnabled,
          aiReplyEnabled: user.aiReplyEnabled,
          aiOnlyReplyEnabled: user.aiOnlyReplyEnabled,
          aiOwnerName: user.aiOwnerName,
          aiRelationshipNotes: user.aiRelationshipNotes,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAISettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id).select('+openaiApiKeyEncrypted +geminiApiKeyEncrypted');
    if (!user) return void res.status(404).json({ success: false, message: 'User not found' });
    const { apiKey, geminiApiKey, removeApiKey, removeGeminiKey, aiProvider, aiAutomationEnabled, aiReplyEnabled, aiOnlyReplyEnabled, aiOwnerName, aiRelationshipNotes } = req.body;
    if (removeApiKey) {
      user.openaiApiKeyEncrypted = null; user.openaiKeyLast4 = null;
    } else if (apiKey) {
      user.openaiApiKeyEncrypted = encrypt(apiKey.trim());
      user.openaiKeyLast4 = apiKey.trim().slice(-4);
    }
    if (removeGeminiKey) { user.geminiApiKeyEncrypted = null; user.geminiKeyLast4 = null; }
    else if (geminiApiKey) { user.geminiApiKeyEncrypted = encrypt(geminiApiKey.trim()); user.geminiKeyLast4 = geminiApiKey.trim().slice(-4); }
    if (aiProvider) user.aiProvider = aiProvider;
    if (typeof aiAutomationEnabled === 'boolean') user.aiAutomationEnabled = aiAutomationEnabled;
    if (typeof aiReplyEnabled === 'boolean') user.aiReplyEnabled = aiReplyEnabled;
    if (typeof aiOnlyReplyEnabled === 'boolean') user.aiOnlyReplyEnabled = aiOnlyReplyEnabled;
    if (typeof aiOwnerName === 'string') user.aiOwnerName = aiOwnerName.trim();
    if (typeof aiRelationshipNotes === 'string') user.aiRelationshipNotes = aiRelationshipNotes.trim();
    if (!user.openaiApiKeyEncrypted && !user.geminiApiKeyEncrypted) user.aiAutomationEnabled = false;
    await user.save();
    res.json({ success: true, data: { openaiConfigured: !!user.openaiKeyLast4, openaiKeyLast4: user.openaiKeyLast4, geminiConfigured: !!user.geminiKeyLast4, geminiKeyLast4: user.geminiKeyLast4, aiProvider: user.aiProvider, aiAutomationEnabled: user.aiAutomationEnabled, aiReplyEnabled: user.aiReplyEnabled, aiOnlyReplyEnabled: user.aiOnlyReplyEnabled, aiOwnerName: user.aiOwnerName, aiRelationshipNotes: user.aiRelationshipNotes } });
  } catch (err) { next(err); }
}

export async function uploadChatTraining(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return void res.status(400).json({ success: false, message: 'Choose a WhatsApp .txt export' });
    const ownerName = String(req.body.ownerName || '').trim();
    if (!ownerName) return void res.status(400).json({ success: false, message: 'Enter your name exactly as shown in the export' });
    const { importWhatsAppExport } = await import('../services/chat-training.service');
    const result = await importWhatsAppExport(req.user?.id || '', ownerName, req.file.buffer.toString('utf8'), req.body.chatName);
    await User.findByIdAndUpdate(req.user?.id, { aiOwnerName: ownerName });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getAICreditStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { checkOpenAICreditAvailability } = await import('../services/openai-assistant.service');
    res.json({ success: true, data: await checkOpenAICreditAvailability(req.user?.id || '') });
  } catch (err) { next(err); }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id).select('+password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    const token = req.cookies?.wa_token;
    if (token) await logoutUser(token);
    res.clearCookie('wa_token', { path: '/' });

    await writeLog({
      level: 'info',
      category: 'auth',
      message: 'Password changed',
      userId: req.user?.id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Password updated. Please sign in again.' });
  } catch (err) {
    next(err);
  }
}
