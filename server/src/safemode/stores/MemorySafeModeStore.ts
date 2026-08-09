import { ISafeModeStore, SafeModeTier } from '../types';

/**
 * In-memory Safe Mode store.
 *
 * Suitable for development, unit tests, and single-instance deployments.
 * NOT suitable for multi-instance production deployments — use RedisSafeModeStore.
 */

interface PhoneState {
  enabled: boolean;
  tier: SafeModeTier;
  startedAt: string | null;
  sentToday: number;
  sentTodayDate: string; // YYYY-MM-DD UTC
  newChatsToday: number;
  newChatsTodayDate: string;
  knownChatCount: number;
  seenJids: Set<string>;
  lastSentAt: number | null;
  totalReplies: number;
  totalSent: number;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): PhoneState {
  const today = todayUtc();
  return {
    enabled: false,
    tier: 1,
    startedAt: null,
    sentToday: 0,
    sentTodayDate: today,
    newChatsToday: 0,
    newChatsTodayDate: today,
    knownChatCount: 0,
    seenJids: new Set(),
    lastSentAt: null,
    totalReplies: 0,
    totalSent: 0,
  };
}

export class MemorySafeModeStore implements ISafeModeStore {
  private readonly states = new Map<string, PhoneState>();

  private get(phoneId: string): PhoneState {
    if (!this.states.has(phoneId)) {
      this.states.set(phoneId, defaultState());
    }
    return this.states.get(phoneId)!;
  }

  /** Resets day-based counters if the UTC date has rolled over */
  private checkDayRollover(state: PhoneState): void {
    const today = todayUtc();
    if (state.sentTodayDate !== today) {
      state.sentToday = 0;
      state.sentTodayDate = today;
    }
    if (state.newChatsTodayDate !== today) {
      state.newChatsToday = 0;
      state.newChatsTodayDate = today;
    }
  }

  async isEnabled(phoneId: string): Promise<boolean> {
    return this.get(phoneId).enabled;
  }

  async setEnabled(phoneId: string, enabled: boolean): Promise<void> {
    this.get(phoneId).enabled = enabled;
  }

  async getTier(phoneId: string): Promise<SafeModeTier> {
    return this.get(phoneId).tier;
  }

  async setTier(phoneId: string, tier: SafeModeTier): Promise<void> {
    this.get(phoneId).tier = tier;
  }

  async getStartedAt(phoneId: string): Promise<string | null> {
    return this.get(phoneId).startedAt;
  }

  async setStartedAt(phoneId: string, isoDate: string): Promise<void> {
    this.get(phoneId).startedAt = isoDate;
  }

  async getSentToday(phoneId: string): Promise<number> {
    const state = this.get(phoneId);
    this.checkDayRollover(state);
    return state.sentToday;
  }

  async incrementSentToday(phoneId: string): Promise<number> {
    const state = this.get(phoneId);
    this.checkDayRollover(state);
    state.sentToday += 1;
    return state.sentToday;
  }

  async getNewChatsToday(phoneId: string): Promise<number> {
    const state = this.get(phoneId);
    this.checkDayRollover(state);
    return state.newChatsToday;
  }

  async incrementNewChatsToday(phoneId: string): Promise<number> {
    const state = this.get(phoneId);
    this.checkDayRollover(state);
    state.newChatsToday += 1;
    return state.newChatsToday;
  }

  async setKnownChatCount(phoneId: string, count: number): Promise<void> {
    this.get(phoneId).knownChatCount = count;
  }

  async getKnownChatCount(phoneId: string): Promise<number> {
    return this.get(phoneId).knownChatCount;
  }

  async hasSeenJid(phoneId: string, toJid: string): Promise<boolean> {
    return this.get(phoneId).seenJids.has(toJid);
  }

  async markJidSeen(phoneId: string, toJid: string): Promise<void> {
    this.get(phoneId).seenJids.add(toJid);
  }

  async getLastSentAt(phoneId: string): Promise<number | null> {
    return this.get(phoneId).lastSentAt;
  }

  async setLastSentAt(phoneId: string, tsMs: number): Promise<void> {
    this.get(phoneId).lastSentAt = tsMs;
  }

  async incrementReplies(phoneId: string): Promise<number> {
    const state = this.get(phoneId);
    state.totalReplies += 1;
    return state.totalReplies;
  }

  async getTotalReplies(phoneId: string): Promise<number> {
    return this.get(phoneId).totalReplies;
  }

  async incrementTotalSent(phoneId: string): Promise<number> {
    const state = this.get(phoneId);
    state.totalSent += 1;
    return state.totalSent;
  }

  async getTotalSent(phoneId: string): Promise<number> {
    return this.get(phoneId).totalSent;
  }

  async reset(phoneId: string): Promise<void> {
    this.states.delete(phoneId);
  }
}
