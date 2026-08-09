import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

/**
 * Shared ioredis client singleton.
 *
 * Used by RedisSafeModeStore and any other Redis consumers.
 * Connection errors are logged but do not crash the process — the app
 * can run without Redis (Safe Mode will fall back gracefully).
 */

let _redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (_redisClient) return _redisClient;

  _redisClient = new Redis(env.REDIS_URL, {
    // Retry up to 3 times with exponential backoff
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) return null; // Stop retrying
      return Math.min(times * 200, 2000);
    },
    lazyConnect: false,
    enableReadyCheck: true,
  });

  _redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  _redisClient.on('error', (err) => {
    logger.error('Redis connection error', { err: err.message });
  });

  _redisClient.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });

  return _redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (_redisClient) {
    await _redisClient.quit().catch(() => _redisClient?.disconnect());
    _redisClient = null;
  }
}
