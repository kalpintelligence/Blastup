import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import os from 'os';

import { WhatsAppInstance } from '../models/WhatsAppInstance';

const router = Router();

const startTime = Date.now();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health and connection status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Health status
 */
router.get('/', async (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const uptimeFormatted = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;
  
  const waInstance = await WhatsAppInstance.findOne({ instanceId: 'default' });

  res.json({
    success: true,
    data: {
      status: 'ok',
      whatsapp: {
        state: waInstance?.status || 'disconnected',
        messagesSent: waInstance?.messagesSent || 0,
        messagesReceived: waInstance?.messagesReceived || 0,
        lastConnectedAt: waInstance?.lastConnectedAt || null,
      },
      uptime: uptimeFormatted,
      uptimeSeconds,
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      loadAvg: os.loadavg(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
