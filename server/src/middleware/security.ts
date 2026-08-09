import { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { env } from '../config/env';

// Apply all security middleware to the Express app
export function applySecurity(app: Application): void {
  // Hide X-Powered-By header
  app.disable('x-powered-by');

  // Trust proxy (needed if behind Nginx)
  app.set('trust proxy', 1);

  // Helmet: sets security headers including CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow media loading
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // CORS — allow everything for public endpoints, only allow the client origin for others
  const strictCors = cors({
    origin: env.CLIENT_URL,
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24h preflight cache
  });

  const openCors = cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  // Public widget endpoints: widget.js download + chatbot message API
  // Must run BEFORE strictCors so that these paths are never restricted.
  app.use((req, res, next) => {
    if (
      req.path === '/widget.js' ||
      req.path.startsWith('/api/chatbot/message')
    ) {
      openCors(req, res, next);
    } else {
      strictCors(req, res, next);
    }
  });

  // Prevent NoSQL injection via MongoDB operators in req.body/params/query
  app.use(
    mongoSanitize({
      replaceWith: '_', // Replace $ and . with _
      onSanitize: ({ req, key }) => {
        // Log sanitization attempt
        console.warn(`⚠️ Sanitized potential injection in ${key} from ${req.ip}`);
      },
    })
  );

  // Prevent HTTP Parameter Pollution attacks
  app.use(hpp());
}

// XSS sanitizer for string inputs
export function sanitizeInput(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
