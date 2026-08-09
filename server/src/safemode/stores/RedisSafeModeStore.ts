import type { Redis } from 'ioredis';
import { ISafeModeStore, SafeModeTier } from '../types';

/**
 * Redis-backed Safe Mode store.
 *
 * Key namespace: `sm:{phoneId}:{field}`
 *
 * Daily counters (sentToday, newChatsToday) use Redis keys with TTL set to
 * the number of seconds remaining until next UTC midnight, ensuring automatic
 * reset without any cron job.
 *
 * Seen-JID membership is stored in a Redis Set: `sm:{phoneId}:seenJids`
 * with a 90-day TTL so it doesn't grow unboundedly.
 */

const NS = 'sm';

function key(phoneId: string, field: string): string {
  return `${NS}:${phoneId}:${field}`;
}

/** Seconds remaining until next UTC midnight */
function secondsUntilMidnightUtc(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1, // next day
      0, 0, 0, 0
    )
  );
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export class RedisSafeModeStore implements ISafeModeStore {
  constructor(private readonly redis: Redis) {}

  async isEnabled(phoneId: string): Promise<boolean> {
    const val = await this.redis.get(key(phoneId, 'enabled'));
    return val === '1';
  }

  async setEnabled(phoneId: string, enabled: boolean): Promise<void> {
    // Persist indefinitely — SM state should outlive daily resets
    await this.redis.set(key(phoneId, 'enabled'), enabled ? '1' : '0');
  }

  async getTier(phoneId: string): Promise<SafeModeTier> {
    const val = await this.redis.get(key(phoneId, 'tier'));
    const n = val ? parseInt(val, 10) : 1;
    return (n >= 1 && n <= 5 ? n : 1) as SafeModeTier;
  }

  async setTier(phoneId: string, tier: SafeModeTier): Promise<void> {
    await this.redis.set(key(phoneId, 'tier'), String(tier));
  }

  async getStartedAt(phoneId: string): Promise<string | null> {
    return this.redis.get(key(phoneId, 'startedAt'));
  }

  async setStartedAt(phoneId: string, isoDate: string): Promise<void> {
    await this.redis.set(key(phoneId, 'startedAt'), isoDate);
  }

  async getSentToday(phoneId: string): Promise<number> {
    const val = await this.redis.get(key(phoneId, 'sentToday'));
    return val ? parseInt(val, 10) : 0;
  }

  async incrementSentToday(phoneId: string): Promise<number> {
    const k = key(phoneId, 'sentToday');
    const pipeline = this.redis.pipeline();
    pipeline.incr(k);
    pipeline.expireat(k, this._nextMidnightUnix());
    const results = await pipeline.exec();
    const incrResult = results?.[0]?.[1];
    return typeof incrResult === 'number' ? incrResult : 0;
  }

  async getNewChatsToday(phoneId: string): Promise<number> {
    const val = await this.redis.get(key(phoneId, 'newChatsToday'));
    return val ? parseInt(val, 10) : 0;
  }

  async incrementNewChatsToday(phoneId: string): Promise<number> {
    const k = key(phoneId, 'newChatsToday');
    const pipeline = this.redis.pipeline();
    pipeline.incr(k);
    pipeline.expireat(k, this._nextMidnightUnix());
    const results = await pipeline.exec();
    const incrResult = results?.[0]?.[1];
    return typeof incrResult === 'number' ? incrResult : 0;
  }

  async setKnownChatCount(phoneId: string, count: number): Promise<void> {
    await this.redis.set(key(phoneId, 'knownChatCount'), String(count));
  }

  async getKnownChatCount(phoneId: string): Promise<number> {
    const val = await this.redis.get(key(phoneId, 'knownChatCount'));
    return val ? parseInt(val, 10) : 0;
  }

  async hasSeenJid(phoneId: string, toJid: string): Promise<boolean> {
    const result = await this.redis.sismember(key(phoneId, 'seenJids'), toJid);
    return result === 1;
  }

  async markJidSeen(phoneId: string, toJid: string): Promise<void> {
    const k = key(phoneId, 'seenJids');
    await this.redis.sadd(k, toJid);
    // Refresh TTL to 90 days on every write
    await this.redis.expire(k, 90 * 24 * 3600);
  }

  async getLastSentAt(phoneId: string): Promise<number | null> {
    const val = await this.redis.get(key(phoneId, 'lastSentAt'));
    return val ? parseInt(val, 10) : null;
  }

  async setLastSentAt(phoneId: string, tsMs: number): Promise<void> {
    await this.redis.set(key(phoneId, 'lastSentAt'), String(tsMs));
  }

  async incrementReplies(phoneId: string): Promise<number> {
    return this.redis.incr(key(phoneId, 'totalReplies'));
  }

  async getTotalReplies(phoneId: string): Promise<number> {
    const val = await this.redis.get(key(phoneId, 'totalReplies'));
    return val ? parseInt(val, 10) : 0;
  }

  async incrementTotalSent(phoneId: string): Promise<number> {
    return this.redis.incr(key(phoneId, 'totalSent'));
  }

  async getTotalSent(phoneId: string): Promise<number> {
    const val = await this.redis.get(key(phoneId, 'totalSent'));
    return val ? parseInt(val, 10) : 0;
  }

  async reset(phoneId: string): Promise<void> {
    const pattern = `${NS}:${phoneId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /** Unix timestamp (seconds) of next UTC midnight */
  private _nextMidnightUnix(): number {
    const now = new Date();
    const midnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      )
    );
    return Math.floor(midnight.getTime() / 1000);
  }
}
