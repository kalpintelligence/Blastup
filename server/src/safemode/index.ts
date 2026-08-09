/**
 * whatsapp-safemode — barrel export
 *
 * Import from here in all application code:
 *
 *   import {
 *     SafeModeManager,
 *     RedisSafeModeStore,
 *     MemorySafeModeStore,
 *     wrapBaileysSocket,
 *     recordKnownChatsFromStore,
 *     createSafeModeRouter,
 *     safeModeErrorHandler,
 *     SafeModeError,
 *   } from '../safemode';
 */

export { SafeModeError } from './SafeModeError';
export type { SafeModeErrorCode } from './SafeModeError';

export { SafeModeManager } from './SafeModeManager';

export { MemorySafeModeStore } from './stores/MemorySafeModeStore';
export { RedisSafeModeStore } from './stores/RedisSafeModeStore';

export { wrapBaileysSocket } from './wrapBaileysSocket';
export { recordKnownChatsFromStore } from './recordKnownChatsFromStore';

export { createSafeModeRouter, safeModeErrorHandler } from './router';

export type {
  SafeModeTier,
  SafeModeStatus,
  SendPayload,
  ISafeModeStore,
  TierConfig,
} from './types';

export {
  TIER_CONFIGS,
  getTierConfig,
  computeNextTier,
  LINK_REGEX,
  SENDING_WINDOW_START_UTC,
  SENDING_WINDOW_END_UTC,
} from './tiers';
