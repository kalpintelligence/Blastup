import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as reminders from '../services/reminder.service';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, ...await reminders.listTasks(req.user?.id || 'default', req.query as Record<string, unknown>) }); } catch (error) { next(error); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await reminders.updateTask(req.user?.id || 'default', Number(req.params.taskId), req.body);
    if (!task) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await reminders.cancelTask(req.user?.id || 'default', Number(req.params.taskId));
    if (!task) { res.status(409).json({ success: false, message: 'Task was not found or has already been sent' }); return; }
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
}
