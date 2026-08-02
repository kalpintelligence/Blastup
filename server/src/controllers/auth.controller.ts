import { Request, Response, NextFunction } from 'express';
import { loginUser, logoutUser, registerUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { writeLog } from '../services/log.service';
import { env } from '../config/env';
import { User } from '../models/User';

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
    const { username, password } = req.body;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await registerUser({ username, password, ip, userAgent });

    res.cookie('wa_token', result.token, COOKIE_OPTIONS);

    await writeLog({
      level: 'info',
      category: 'auth',
      message: `New user registered: ${username}`,
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
        },
      },
    });
  } catch (err) {
    next(err);
  }
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
