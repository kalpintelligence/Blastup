import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Message } from '../models/Message';

const router = Router();
router.use(authenticate);

/**
 * GET /api/analytics/messages/weekly
 * Returns per-day sent + received message counts for the last 7 days (today included).
 */
router.get('/messages/weekly', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const instanceId = req.user?.id || 'default';

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const results = await Message.aggregate([
      {
        $match: {
          instanceId,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$timestamp' },
            month: { $month: '$timestamp' },
            day:   { $dayOfMonth: '$timestamp' },
            fromMe: '$fromMe',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map of date -> { sent, received }
    const dayMap: Record<string, { sent: number; received: number }> = {};

    // Pre-fill with zeros for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      dayMap[key] = { sent: 0, received: 0 };
    }

    for (const row of results) {
      const key = `${row._id.year}-${row._id.month}-${row._id.day}`;
      if (dayMap[key]) {
        if (row._id.fromMe) {
          dayMap[key].sent += row.count;
        } else {
          dayMap[key].received += row.count;
        }
      }
    }

    // Return as ordered array with day labels
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = Object.entries(dayMap).map(([dateStr, counts]) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return {
        date: dateStr,
        day: DAYS[date.getDay()],
        sent: counts.sent,
        received: counts.received,
        total: counts.sent + counts.received,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
