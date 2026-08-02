import { Response, NextFunction } from 'express';
import * as wa from '../services/whatsapp.service';
import { writeLog } from '../services/log.service';
import { AuthRequest } from '../middleware/auth';

export async function getStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const instance = await wa.getInstanceStatus(instanceId);
    res.json({ success: true, data: instance });
  } catch (err) {
    next(err);
  }
}

export async function getQR(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const qr = await wa.getQRCode(instanceId);
    if (!qr) {
      res.status(404).json({ success: false, error: 'QR not available. Connect or check status.' });
      return;
    }
    res.json({ success: true, data: { qr } });
  } catch (err) {
    next(err);
  }
}

export async function reconnect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    await wa.restartWhatsApp(instanceId);
    await writeLog({ level: 'info', category: 'whatsapp', message: 'Manual reconnect triggered', userId: req.user?.id });
    res.json({ success: true, message: 'Reconnect initiated' });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    await wa.disconnectWhatsApp(instanceId);
    await writeLog({ level: 'info', category: 'whatsapp', message: 'WhatsApp logged out', userId: req.user?.id });
    res.json({ success: true, message: 'WhatsApp logged out' });
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    await wa.deleteSession(instanceId);
    await writeLog({ level: 'warn', category: 'whatsapp', message: 'WhatsApp session deleted', userId: req.user?.id });
    res.json({ success: true, message: 'Session deleted. Restart to create new session.' });
  } catch (err) {
    next(err);
  }
}
