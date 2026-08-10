import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

import { applySecurity } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { authenticate } from './middleware/auth';

import authRoutes from './routes/auth.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import chatRoutes from './routes/chat.routes';
import contactRoutes from './routes/contact.routes';
import sendRoutes from './routes/send.routes';
import logRoutes from './routes/log.routes';
import healthRoutes from './routes/health.routes';
import apiKeyRoutes from './routes/apikey.routes';
import campaignRoutes from './routes/campaign.routes';
import chatbotRoutes from './routes/chatbot.routes';

import { initCampaignScheduler } from './services/campaignScheduler';
import { normalizeExistingDatabase } from './utils/jid';
import { createSafeModeRouter, safeModeErrorHandler } from './safemode';
import { getSafeModeManager } from './config/safemode';

import { env } from './config/env';

export function createApp(): express.Application {
  const app = express();

  // ── Initialize background services ──────────────────────────────
  initCampaignScheduler();
  normalizeExistingDatabase().catch(() => { });

  // ── Security middleware ─────────────────────────────────────────
  applySecurity(app);

  // ── Body parsers ────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));

  app.use(
    express.urlencoded({
      extended: true,
      limit: '1mb',
    })
  );
  app.use(cookieParser());

  // ── Compression ────────────────────────────────────────────────
  app.use(compression());

  // ── Static file serving: uploads ────────────────────────────────
  app.use(
    '/uploads',
    express.static(path.resolve(env.UPLOAD_DIR), {
      index: false,
      dotfiles: 'deny',
    })
  );

  // ── Static file serving: chatbot widget ─────────────────────────
  //
  // Explicitly adds Access-Control-Allow-Origin: * so ANY external website
  // (including file:// origins) can load widget.js without CORS errors.
  //
  app.use(
    '/widget.js',
    express.static(
      path.resolve(process.cwd(), 'public/widget.js'),
      {
        index: false,
        dotfiles: 'deny',
        fallthrough: false,
        setHeaders: (res) => {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          // Allow browser caching of widget.js
          res.setHeader('Cache-Control', 'public, max-age=300');
        },
      }
    )
  );

  // ── Static file serving: robots.txt ─────────────────────────────
  app.use(
    '/robots.txt',
    express.static(
      path.resolve(process.cwd(), 'public/robots.txt'),
      {
        index: false,
        dotfiles: 'deny',
        fallthrough: false,
        setHeaders: (res) => {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Cache-Control', 'public, max-age=86400');
        },
      }
    )
  );

  // ── Favicon fallback: return 204 to avoid 404 logs ──────────────
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });


  // ── Swagger API Docs ────────────────────────────────────────────
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',

      info: {
        title: 'WhatsApp Automation Platform API',
        version: '1.0.0',
        description:
          'Production-ready WhatsApp automation REST API',
      },

      components: {
        securitySchemes: {
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description:
              'API Key from Settings > API Keys. Pass as x-api-key header.',
          },
        },
      },

      security: [
        {
          apiKeyAuth: [],
        },
      ],
    },

    apis: ['./src/routes/*.ts'],
  });

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

  app.get(
    '/api/docs.json',
    (req, res) => res.json(swaggerSpec)
  );

  // ── API Routes ──────────────────────────────────────────────────

  app.use(
    '/api/health',
    healthRoutes
  );

  app.use(
    '/api/auth',
    authRoutes
  );

  app.use(
    '/api/whatsapp',
    apiLimiter,
    whatsappRoutes
  );

  app.use(
    '/api/chats',
    apiLimiter,
    chatRoutes
  );

  app.use(
    '/api/contacts',
    apiLimiter,
    contactRoutes
  );

  app.use(
    '/api/send',
    apiLimiter,
    sendRoutes
  );

  app.use(
    '/api/campaigns',
    apiLimiter,
    campaignRoutes
  );

  app.use(
    '/api/logs',
    apiLimiter,
    logRoutes
  );

  app.use(
    '/api/keys',
    apiLimiter,
    apiKeyRoutes
  );

  // ── Chatbot API ─────────────────────────────────────────────────
  //
  // Widget will call:
  //
  // POST /api/chatbot/message
  //
  app.use(
    '/api/chatbot',
    apiLimiter,
    chatbotRoutes
  );

  // ── Safe Mode API ────────────────────────────────────────────────
  app.use(
    '/api/safemode',
    apiLimiter,
    authenticate,
    createSafeModeRouter(getSafeModeManager(), express)
  );

  // ── Error Handling ──────────────────────────────────────────────

  app.use(
    notFoundHandler
  );

  // SafeModeError handler must come before the generic errorHandler
  app.use(safeModeErrorHandler());

  app.use(
    errorHandler
  );

  return app;
}