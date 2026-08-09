/**
 * Safe Mode singleton — shared across the entire server process.
 *
 * Imported by whatsapp.service.ts (socket wiring) and app.ts (router mount).
 * Using a module-level singleton ensures one instance of SafeModeManager
 * regardless of import order.
 */
import { SafeModeManager } from '../safemode/SafeModeManager';
import { RedisSafeModeStore } from '../safemode/stores/RedisSafeModeStore';
import { MemorySafeModeStore } from '../safemode/stores/MemorySafeModeStore';
import { getRedisClient } from './redis';
import { env } from './env';
import { logger } from './logger';

let _safeModeManager: SafeModeManager | null = null;

export function getSafeModeManager(): SafeModeManager {
  if (_safeModeManager) return _safeModeManager;

  try {
    const redisClient = getRedisClient();
    const store = new RedisSafeModeStore(redisClient);
    _safeModeManager = new SafeModeManager(store);
    logger.info('SafeModeManager initialized with RedisSafeModeStore');
  } catch (err) {
    logger.warn('Failed to create RedisSafeModeStore — falling back to MemorySafeModeStore', { err });
    _safeModeManager = new SafeModeManager(new MemorySafeModeStore());
  }

  return _safeModeManager;
}
