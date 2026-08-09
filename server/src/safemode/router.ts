import { Router, Application } from 'express';
import { Request, Response, NextFunction } from 'express';
import { SafeModeManager } from './SafeModeManager';
import { SafeModeError } from './SafeModeError';
import { SafeModeTier } from './types';

/**
 * createSafeModeRouter
 *
 * Returns an Express Router with the following endpoints:
 *
 *   GET  /:phoneId/status    — current tier, day, counters, cap
 *   POST /:phoneId/enable    — body: { tier?: 1-5 }
 *   POST /:phoneId/disable
 *
 * Mount under `/api/safemode` with authenticate + apiLimiter middleware.
 */
export function createSafeModeRouter(
  manager: SafeModeManager,
  _express?: any // kept for API compatibility
): Router {
  const router = Router();

  /**
   * @swagger
   * /api/safemode/{phoneId}/status:
   *   get:
   *     summary: Get Safe Mode status for a phone number
   *     tags: [SafeMode]
   */
  router.get('/:phoneId/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneId } = req.params;
      const status = await manager.getStatus(phoneId);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/safemode/{phoneId}/enable:
   *   post:
   *     summary: Enable Safe Mode for a phone number
   *     tags: [SafeMode]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               tier:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   */
  router.post('/:phoneId/enable', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneId } = req.params;
      const tier = (req.body?.tier as SafeModeTier) || 1;

      // Validate tier
      if (tier < 1 || tier > 5 || !Number.isInteger(tier)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'tier must be an integer between 1 and 5',
        });
        return;
      }

      await manager.enable(phoneId, tier as SafeModeTier);

      // Persist to MongoDB for visibility in the session table
      try {
        const { WhatsAppInstance } = await import('../models/WhatsAppInstance');
        await WhatsAppInstance.findOneAndUpdate(
          { instanceId: phoneId },
          {
            safeModeEnabled: true,
            safeModeStartedAt: new Date(),
            safeModeStartTier: tier,
          }
        );
      } catch {
        // Non-fatal — Redis is the source of truth
      }

      const status = await manager.getStatus(phoneId);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/safemode/{phoneId}/disable:
   *   post:
   *     summary: Disable Safe Mode for a phone number
   *     tags: [SafeMode]
   */
  router.post('/:phoneId/disable', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneId } = req.params;
      await manager.disable(phoneId);

      // Persist to MongoDB
      try {
        const { WhatsAppInstance } = await import('../models/WhatsAppInstance');
        await WhatsAppInstance.findOneAndUpdate(
          { instanceId: phoneId },
          { safeModeEnabled: false }
        );
      } catch {
        // Non-fatal
      }

      const status = await manager.getStatus(phoneId);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/**
 * safeModeErrorHandler
 *
 * Express error-handling middleware that converts SafeModeError into
 * a structured JSON response. Mount this BEFORE the generic errorHandler.
 *
 *   F13 → 422 Unprocessable Entity
 *   F14 → 429 Too Many Requests
 *   F15 → 422 Unprocessable Entity
 */
export function safeModeErrorHandler() {
  return function safeModeErrorMiddleware(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!(err instanceof SafeModeError)) {
      next(err);
      return;
    }

    const statusMap: Record<string, number> = {
      F13: 422,
      F14: 429,
      F15: 422,
    };

    const httpStatus = statusMap[err.code] ?? 422;

    res.status(httpStatus).json({
      success: false,
      error: 'SafeModeError',
      code: err.code,
      message: err.detail,
    });
  };
}
