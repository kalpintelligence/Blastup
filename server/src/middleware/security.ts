import { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Apply all security middleware to the Express app
export function applySecurity(app: Application): void {
  // Hide X-Powered-By header
  app.disable('x-powered-by');

  // Trust proxy (needed if behind reverse proxy)
  app.set('trust proxy', 1);

  // Helmet — disable CSP and referrer restrictions so the widget script
  // can be embedded on ANY external site without being blocked.
  app.use(
    helmet({
      contentSecurityPolicy: false,     // No CSP — widget must run on any site
      crossOriginEmbedderPolicy: false, // Allow cross-origin media/scripts
      crossOriginResourcePolicy: false, // Allow cross-origin resource loading
      referrerPolicy: false,            // Don't override referrer policy
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // ── Global open CORS ─────────────────────────────────────────────
  // Allow ALL origins — no whitelisting, no domain restrictions.
  // Anyone can copy-paste the widget snippet and it works immediately.
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400,
    })
  );

  // Handle OPTIONS preflight for all routes
  app.options('*', cors({ origin: '*' }));

  // Prevent NoSQL injection via MongoDB operators in req.body/params/query
  app.use(
    mongoSanitize({
      replaceWith: '_',
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

