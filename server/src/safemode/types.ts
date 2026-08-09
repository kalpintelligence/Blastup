/**
 * Safe Mode — core types
 *
 * These are the shared contracts for stores, manager and the router.
 */

/** Tier number 1-5 */
export type SafeModeTier = 1 | 2 | 3 | 4 | 5;

/** Per-tier send limits */
export interface TierConfig {
  tier: SafeModeTier;
  /** Maximum messages allowed per day (undefined = unlimited) */
  dailyCap: number | undefined;
  /** Minimum gap between messages in milliseconds */
  minGapMs: number;
  /** Maximum new-chat JIDs allowed per day (undefined = unlimited) */
  newChatsPerDay: number | undefined;
  /** Whether links are blocked in the very first message to a new JID */
  blockLinkInFirstMessage: boolean;
  /** Whether groupCreate / groupParticipantsUpdate are blocked */
  blockGroupActions: boolean;
  /** How many calendar days this tier lasts (undefined = permanent) */
  durationDays: number | undefined;
  /** Minimum reply-rate fraction required to advance to next tier (0-1) */
  minReplyRate: number;
}

/** Live status snapshot for one phone number */
export interface SafeModeStatus {
  phoneId: string;
  enabled: boolean;
  tier: SafeModeTier;
  /** ISO date string of when Safe Mode was first enabled for this number */
  startedAt: string | null;
  /** Day count since Safe Mode enabled (1-based) */
  day: number;
  /** Messages sent today (UTC) */
  sentToday: number;
  /** Daily cap for current tier */
  dailyCap: number | undefined;
  /** New chats initiated today (UTC) */
  newChatsToday: number;
  /** New-chat cap for current tier */
  newChatsPerDayCap: number | undefined;
  /** Total replies received since tracking started */
  totalReplies: number;
  /** Total messages sent since tracking started */
  totalSent: number;
  /** Computed reply rate (0-1) */
  replyRate: number;
  /** Unix ms of last message sent */
  lastSentAt: number | null;
}

/** Payload describing an outgoing send operation, used for rule checking */
export interface SendPayload {
  /** Destination JID */
  toJid: string;
  /** Raw text content of the message (used for link detection) */
  text?: string;
  /** Whether this is a group create operation */
  isGroupCreate?: boolean;
  /** Whether this is a group participants update */
  isGroupUpdate?: boolean;
}

/** Storage interface — implemented by Redis or Memory store */
export interface ISafeModeStore {
  /** Is safe mode enabled for this number? */
  isEnabled(phoneId: string): Promise<boolean>;
  /** Enable safe mode, optionally at a specific tier */
  setEnabled(phoneId: string, enabled: boolean): Promise<void>;

  /** Get current tier */
  getTier(phoneId: string): Promise<SafeModeTier>;
  /** Set tier */
  setTier(phoneId: string, tier: SafeModeTier): Promise<void>;

  /** Get the ISO date string when SM was first enabled */
  getStartedAt(phoneId: string): Promise<string | null>;
  /** Set the started-at timestamp (set once on enable) */
  setStartedAt(phoneId: string, isoDate: string): Promise<void>;

  /** Messages sent in the current UTC day */
  getSentToday(phoneId: string): Promise<number>;
  /** Increment sent-today counter, auto-resets at UTC midnight */
  incrementSentToday(phoneId: string): Promise<number>;

  /** New chats initiated in the current UTC day */
  getNewChatsToday(phoneId: string): Promise<number>;
  /** Increment new-chats-today counter */
  incrementNewChatsToday(phoneId: string): Promise<number>;

  /** Set the baseline known-chat count (so existing contacts don't count as "new") */
  setKnownChatCount(phoneId: string, count: number): Promise<void>;
  /** Get known-chat count */
  getKnownChatCount(phoneId: string): Promise<number>;

  /** Check whether a JID has been chatted with before (for first-message rules) */
  hasSeenJid(phoneId: string, toJid: string): Promise<boolean>;
  /** Mark a JID as seen */
  markJidSeen(phoneId: string, toJid: string): Promise<void>;

  /** Unix ms of last message sent */
  getLastSentAt(phoneId: string): Promise<number | null>;
  /** Update last-sent timestamp */
  setLastSentAt(phoneId: string, tsMs: number): Promise<void>;

  /** Increment total reply count */
  incrementReplies(phoneId: string): Promise<number>;
  /** Get total replies */
  getTotalReplies(phoneId: string): Promise<number>;

  /** Increment total sent count (all-time, not just today) */
  incrementTotalSent(phoneId: string): Promise<number>;
  /** Get total sent */
  getTotalSent(phoneId: string): Promise<number>;

  /** Delete all keys for a phone (for testing / cleanup) */
  reset(phoneId: string): Promise<void>;
}
