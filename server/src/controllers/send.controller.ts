import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validateFile } from '../utils/fileValidation';
import * as messageService from '../services/message.service';
import { env } from '../config/env';
import Boom from '@hapi/boom';
import fs from 'fs';

// Multer config — store with UUID filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const validation = validateFile(file.mimetype, 0, file.originalname);
  if (!validation.valid) {
    cb(new Error(validation.error || 'Invalid file'));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE, files: 1 },
});

export async function sendText(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { to, text } = req.body;
    const result = await messageService.sendText(instanceId, { to, text });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

export async function sendImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    if (!req.file) throw Boom.badRequest('Image file is required');
    const validation = validateFile(req.file.mimetype, req.file.size, req.file.originalname);
    if (!validation.valid) throw Boom.badRequest(validation.error);

    const result = await messageService.sendImage(instanceId, {
      to: req.body.to,
      caption: req.body.caption,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
    });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

export async function sendVideo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    if (!req.file) throw Boom.badRequest('Video file is required');
    const validation = validateFile(req.file.mimetype, req.file.size, req.file.originalname);
    if (!validation.valid) throw Boom.badRequest(validation.error);

    const result = await messageService.sendVideo(instanceId, {
      to: req.body.to,
      caption: req.body.caption,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
    });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

export async function sendAudio(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    if (!req.file) throw Boom.badRequest('Audio file is required');
    const result = await messageService.sendAudio(instanceId, {
      to: req.body.to,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
    });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

export async function sendDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    if (!req.file) throw Boom.badRequest('Document file is required');
    const result = await messageService.sendDocument(instanceId, {
      to: req.body.to,
      caption: req.body.caption,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
    });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

export async function sendButton(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { to, text, footer, buttons } = req.body;
    const result = await messageService.sendButton(instanceId, { to, text, footer, buttons: buttons || [] });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

export async function sendSlider(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { to, title, text, footer, items } = req.body;
    const result = await messageService.sendSlider(instanceId, { to, title, text, footer, items: items || [] });
    res.json({ success: true, data: { messageId: result?.key.id } });
  } catch (err) {
    next(err);
  }
}

