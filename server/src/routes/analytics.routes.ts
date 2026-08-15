import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Message } from '../models/Message';
import { Campaign } from '../models/Campaign';
import { ChatbotLead } from '../models/ChatbotLead';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/analytics/messages/weekly:
 *   get:
 *     summary: Get weekly sent and received message analytics
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: 7-day daily message traffic distribution
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

// Fast, account-scoped totals for the dashboard, compared with the prior period.
router.get('/overview', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const instanceId = req.user?.id || 'default';
    const requestedDays = Number(req.query.days);
    const days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(1, requestedDays)) : 7;
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - (days - 1));
    currentStart.setHours(0, 0, 0, 0);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);

    const [messageStats, leadStats, campaignStats] = await Promise.all([
      Message.aggregate([
        { $match: { instanceId, timestamp: { $gte: previousStart }, isDeleted: false } },
        { $group: { _id: { current: { $gte: ['$timestamp', currentStart] }, fromMe: '$fromMe' }, count: { $sum: 1 } } },
      ]),
      ChatbotLead.aggregate([
        { $match: { instanceId, createdAt: { $gte: previousStart } } },
        { $group: { _id: { current: { $gte: ['$createdAt', currentStart] } }, count: { $sum: 1 } } },
      ]),
      Campaign.aggregate([
        { $match: { instanceId } },
        { $group: { _id: null, campaigns: { $sum: 1 }, sent: { $sum: '$stats.sent' }, delivered: { $sum: '$stats.delivered' }, read: { $sum: '$stats.read' }, failed: { $sum: '$stats.failed' } } },
      ]),
    ]);

    const messages = { sent: 0, received: 0, previousSent: 0, previousReceived: 0 };
    for (const row of messageStats) {
      const key = row._id.current ? (row._id.fromMe ? 'sent' : 'received') : (row._id.fromMe ? 'previousSent' : 'previousReceived');
      messages[key as keyof typeof messages] += row.count;
    }
    const leads = { current: 0, previous: 0 };
    for (const row of leadStats) leads[row._id.current ? 'current' : 'previous'] += row.count;
    const campaigns = campaignStats[0] || { campaigns: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
    const trend = (value: number, previous: number) => previous ? Math.round(((value - previous) / previous) * 1000) / 10 : null;

    res.json({ success: true, data: {
      days,
      messages: { ...messages, total: messages.sent + messages.received, trend: trend(messages.sent + messages.received, messages.previousSent + messages.previousReceived) },
      leads: { ...leads, trend: trend(leads.current, leads.previous) },
      campaigns: { ...campaigns, deliveryRate: campaigns.sent ? Math.round((campaigns.delivered / campaigns.sent) * 1000) / 10 : 0, readRate: campaigns.delivered ? Math.round((campaigns.read / campaigns.delivered) * 1000) / 10 : 0 },
    } });
  } catch (err) {
    next(err);
  }
});

export default router;
