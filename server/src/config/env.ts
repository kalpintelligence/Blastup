import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in the server dir first, then fall back to the monorepo root.
// This allows both `cd server && npm run dev` and root-level `npm run dev` to work.
const localEnv = path.join(process.cwd(), '.env');
const rootEnv = path.join(process.cwd(), '..', '.env');
const envPath = fs.existsSync(localEnv) ? localEnv : rootEnv;
dotenv.config({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  // Admin seed
  ADMIN_USERNAME: z.string().min(3, 'ADMIN_USERNAME is required'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  // CORS
  CLIENT_URL: z.string().default('http://localhost:3000'),
  // File uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB
  // Sessions
  SESSION_DIR: z.string().default('./sessions'),
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  LOGIN_RATE_LIMIT_MAX: z.string().default('5').transform(Number),
  ACCOUNT_LOCK_DURATION_MINUTES: z.string().default('30').transform(Number),
  // Redis (used by Safe Mode and any future caching)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
