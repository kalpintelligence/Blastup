import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

import { applySecurity } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

import authRoutes from './routes/auth.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import chatRoutes from './routes/chat.routes';
import contactRoutes from './routes/contact.routes';
import sendRoutes from './routes/send.routes';
import logRoutes from './routes/log.routes';
import healthRoutes from './routes/health.routes';
import apiKeyRoutes from './routes/apikey.routes';

import { env } from './config/env';

export function createApp(): express.Application {
  const app = express();

  // ── Security middleware ──────────────────────────────────────────
  applySecurity(app);

  // ── Body parsers ─────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // ── Compression ──────────────────────────────────────────────────
  app.use(compression());

  // ── Static file serving (uploads) ────────────────────────────────
  // Disable directory listing — serve individual files only by exact path
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR), {
    index: false,
    dotfiles: 'deny',
  }));

  // ── Swagger API Docs ─────────────────────────────────────────────
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'WhatsApp Automation Platform API',
        version: '1.0.0',
        description: 'Production-ready WhatsApp automation REST API',
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'wa_token',
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
    apis: ['./src/routes/*.ts'],
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

  // ── API Routes ───────────────────────────────────────────────────
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/whatsapp', apiLimiter, whatsappRoutes);
  app.use('/api/chats', apiLimiter, chatRoutes);
  app.use('/api/contacts', apiLimiter, contactRoutes);
  app.use('/api/send', apiLimiter, sendRoutes);
  app.use('/api/logs', apiLimiter, logRoutes);
  app.use('/api/keys', apiLimiter, apiKeyRoutes);

  // ── Error Handling ───────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
