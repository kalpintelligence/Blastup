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

export async function importContacts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { contacts, groups } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      res.status(400).json({ success: false, error: 'Contacts array is required' });
      return;
    }
    const result = await contactService.importContacts(instanceId, contacts, groups || []);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getGroups(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const groups = await contactService.getGroups(instanceId);
    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
}

export async function updateContactGroups(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { jids, groups, action } = req.body;
    if (!Array.isArray(jids) || !Array.isArray(groups)) {
      res.status(400).json({ success: false, error: 'jids and groups arrays are required' });
      return;
    }
    const result = await contactService.updateContactGroups(instanceId, jids, groups, action || 'add');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { jid } = req.params;
    const contact = await contactService.updateContact(instanceId, decodeURIComponent(jid), req.body);
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const { jid } = req.params;
    await contactService.deleteContact(instanceId, decodeURIComponent(jid));
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err) {
    next(err);
  }
}


