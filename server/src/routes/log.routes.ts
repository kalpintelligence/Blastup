import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listLogs } from '../services/log.service';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: List system audit logs
 *     tags: [Logs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of audit logs
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await listLogs(req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
