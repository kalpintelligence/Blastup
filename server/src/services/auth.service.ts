import { User } from '../models/User';
import { Session } from '../models/Session';
import { signToken } from '../utils/jwt';
import { hashToken } from '../utils/crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import Boom from '@hapi/boom';
import ms from 'ms';

export interface LoginParams {
  username: string;
  password: string;
  ip: string;
  userAgent: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export async function loginUser(params: LoginParams): Promise<LoginResult> {
  const { username, password, ip, userAgent } = params;

  // Load user with password (select: false by default)
  const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

  if (!user || !user.isActive) {
    throw Boom.unauthorized('Invalid credentials');
  }

  // Check account lock
  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 60000);
    throw Boom.tooManyRequests(`Account locked. Try again in ${minutesLeft} minutes.`);
  }

  // Verify password
  const isValid = await user.comparePassword(password);

  if (!isValid) {
    // Increment failed attempts
    user.failedLoginAttempts += 1;
    logger.warn('Failed login attempt', { username, ip, attempts: user.failedLoginAttempts });

    // Lock after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION_MINUTES * 60 * 1000);
      logger.warn('Account locked due to failed attempts', { username, ip });
    }

    await user.save();
    throw Boom.unauthorized('Invalid credentials');
  }

  // Successful login — reset counters
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ip;
  await user.save();

  // Create JWT
  const token = signToken({
    sub: user._id.toString(),
    username: user.username,
    role: user.role,
  });

  // Store hashed session
  const tokenHash = hashToken(token);
  const expiresIn = env.JWT_EXPIRES_IN;
  const expiresAt = new Date(Date.now() + (parseMs(expiresIn)));

  await Session.create({
    userId: user._id,
    tokenHash,
    ip,
    userAgent,
    expiresAt,
  });

  logger.info('User logged in', { username, ip });

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    },
  };
}

export async function registerUser(params: LoginParams): Promise<LoginResult> {
  const { username, password, ip, userAgent } = params;

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    throw Boom.conflict('Username already taken');
  }

  const user = await User.create({
    username: username.toLowerCase().trim(),
    password,
    role: 'user',
  });

  const token = signToken({
    sub: user._id.toString(),
    username: user.username,
    role: user.role,
  });

  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + parseMs('24h'));

  await Session.create({
    userId: user._id,
    tokenHash,
    ip,
    userAgent,
    expiresAt,
  });

  logger.info('User registered', { username, ip });

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    },
  };
}

export async function logoutUser(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await Session.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  logger.info('User logged out');
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
}

function parseMs(duration: string): number {
  // Simple parser for '24h', '7d', '1h', etc.
  const units: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 86400000; // default 24h
  return parseInt(match[1]) * (units[match[2]] || 3600000);
}
