import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as contactService from '../services/contact.service';

export async function getContacts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const result = await contactService.listContacts(instanceId, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const contact = await contactService.getContactById(instanceId, req.params.jid);
    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}
