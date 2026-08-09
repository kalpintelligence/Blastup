import { TierConfig, SafeModeTier } from './types';

/**
 * 5-tier warm-up configuration table.
 *
 * Tier 1 → very conservative (first 3 days)
 * Tier 5 → effectively unlimited after 2+ weeks
 *
 * Sending window: 09:00–21:00 UTC is enforced in SafeModeManager, not here.
 */
export const TIER_CONFIGS: Record<SafeModeTier, TierConfig> = {
  1: {
    tier: 1,
    dailyCap: 10,
    minGapMs: 10_000,      // 10 seconds between messages
    newChatsPerDay: 0,     // No new chats allowed at all
    blockLinkInFirstMessage: true,
    blockGroupActions: true,
    durationDays: 3,
    minReplyRate: 0.05,    // 5% reply rate to advance
  },
  2: {
    tier: 2,
    dailyCap: 50,
    minGapMs: 5_000,       // 5 seconds
    newChatsPerDay: 10,
    blockLinkInFirstMessage: true,
    blockGroupActions: true,
    durationDays: 4,       // Days 4-7
    minReplyRate: 0.05,
  },
  3: {
    tier: 3,
    dailyCap: 150,
    minGapMs: 3_000,       // 3 seconds
    newChatsPerDay: 30,
    blockLinkInFirstMessage: false,
    blockGroupActions: false,
    durationDays: 3,       // Days 8-10
    minReplyRate: 0.03,
  },
  4: {
    tier: 4,
    dailyCap: 500,
    minGapMs: 2_000,       // 2 seconds
    newChatsPerDay: 100,
    blockLinkInFirstMessage: false,
    blockGroupActions: false,
    durationDays: 2,       // Days 11-12
    minReplyRate: 0.02,
  },
  5: {
    tier: 5,
    dailyCap: undefined,   // Unlimited
    minGapMs: 1_000,       // 1 second minimum gap
    newChatsPerDay: undefined,
    blockLinkInFirstMessage: false,
    blockGroupActions: false,
    durationDays: undefined,
    minReplyRate: 0,
  },
};

/** UTC hour window: 09:00 – 21:00 (inclusive start, exclusive end) */
export const SENDING_WINDOW_START_UTC = 9;
export const SENDING_WINDOW_END_UTC = 21;

/**
 * Regex to detect URLs/links in message text.
 * Matches http/https URLs and raw domain patterns (e.g. t.me/..., wa.me/...).
 */
export const LINK_REGEX =
  /(?:https?:\/\/|(?:www\.|t\.me\/|wa\.me\/|bit\.ly\/|tinyurl\.com\/))[^\s<>"']+/i;

/**
 * Get the tier config for a given tier number.
 */
export function getTierConfig(tier: SafeModeTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Determine which tier a number should be at given a day count and reply rate.
 * Does NOT advance past the current tier's min duration — only called when
 * SafeModeManager decides a tier change is appropriate.
 */
export function computeNextTier(
  currentTier: SafeModeTier,
  dayCount: number,
  replyRate: number
): SafeModeTier {
  const config = TIER_CONFIGS[currentTier];

  // Already at max tier
  if (currentTier === 5) return 5;

  // Not yet served the minimum duration
  if (config.durationDays !== undefined && dayCount < config.durationDays) {
    return currentTier;
  }

  // Hasn't met the reply rate threshold
  if (replyRate < config.minReplyRate) {
    return currentTier;
  }

  return (currentTier + 1) as SafeModeTier;
}
