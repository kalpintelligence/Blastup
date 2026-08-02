import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../models/ApiKey';
import { hashToken } from '../utils/crypto';
import crypto from 'crypto';
import Boom from '@hapi/boom';
import { writeLog } from '../services/log.service';
import { AuthRequest } from '../middleware/auth';

export async function createApiKey(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;
    
    // Generate a secure random string
    const rawKey = 'wa_' + crypto.randomBytes(24).toString('hex');
    const keyHash = hashToken(rawKey);

    const apiKey = await ApiKey.create({
      name,
      key: rawKey,
      keyHash,
      userId: req.user?.id,
    });

    await writeLog({
      level: 'info',
      category: 'system',
      message: `API Key created: ${name}`,
      userId: req.user?.id,
      ip: req.ip || req.ips[0],
    });

    // Return the raw key ONLY ONCE. It cannot be retrieved again.
    res.status(201).json({
      success: true,
      message: 'API Key created successfully. Please copy it now as it will not be shown again.',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key: rawKey,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listApiKeys(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter = req.user?.id ? { userId: req.user.id } : {};
    const keys = await ApiKey.find(filter).select('-keyHash').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: keys,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteApiKey(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.user?.id) filter.userId = req.user.id;
    const key = await ApiKey.findOneAndDelete(filter);

    if (!key) {
      throw Boom.notFound('API Key not found');
    }

    await writeLog({
      level: 'info',
      category: 'system',
      message: `API Key deleted: ${key.name}`,
      userId: req.user?.id,
      ip: req.ip || req.ips[0],
    });

    res.json({
      success: true,
      message: 'API Key deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
