import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { logger } from '../config/logger';

// General API rate limit
export const apiLimiter = rateLimit({
  skip: () => true,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 60000),
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json(options.message);
  },
});

// Strict login rate limit
export const loginLimiter = rateLimit({
  skip: () => true,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.LOGIN_RATE_LIMIT_MAX, // default 5
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  handler: (req, res, next, options) => {
    logger.warn('Login rate limit exceeded', { ip: req.ip });
    res.status(429).json(options.message);
  },
});

// QR endpoint — prevent spamming
export const qrLimiter = rateLimit({
  skip: () => true,
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many QR requests' },
});

// Send message limiter
export const sendLimiter = rateLimit({
  skip: () => true,
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: { success: false, error: 'Sending too fast, slow down.' },
});
