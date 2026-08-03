import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { hashToken } from '../utils/crypto';
import { logger } from '../config/logger';
import Boom from '@hapi/boom';

import { ApiKey } from '../models/ApiKey';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Check for API Key (Headers)
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      const keyHash = hashToken(apiKeyHeader);
      const apiKeyDoc = await ApiKey.findOne({ keyHash });
      
      if (apiKeyDoc) {
        // Update lastUsedAt in the background
        ApiKey.updateOne({ _id: apiKeyDoc._id }, { lastUsedAt: new Date() }).exec();

        req.user = {
          // Must be the owning account's id, not the key's own id — this is
          // used everywhere as the WhatsApp instanceId, so using the key's
          // id here would point at an instance that never exists.
          id: apiKeyDoc.userId.toString(),
          username: `API_KEY_${apiKeyDoc.name}`,
          role: 'api',
        };
        return next();
      }
    }

    // 2. Fallback to JWT (Cookie)
    const token = req.cookies?.wa_token;

    if (!token) {
      throw Boom.unauthorized('Authentication required (Invalid API Key or missing Session Cookie)');
    }

    // Verify JWT signature and expiry
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch (err) {
      throw Boom.unauthorized('Invalid or expired token');
    }

    // Verify session exists and is not revoked
    const tokenHash = hashToken(token);
    const session = await Session.findOne({ tokenHash, isRevoked: false });
    if (!session) {
      throw Boom.unauthorized('Session expired or revoked');
    }

    // Load user
    const user = await User.findById(decoded.sub).select('username role isActive');
    if (!user || !user.isActive) {
      throw Boom.unauthorized('User not found or deactivated');
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    next(Boom.forbidden('Admin access required'));
    return;
  }
  next();
}
