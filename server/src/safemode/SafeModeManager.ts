import {
  ISafeModeStore,
  SafeModeTier,
  SafeModeStatus,
  SendPayload,
} from './types';
import { SafeModeError } from './SafeModeError';
import {
  getTierConfig,
  computeNextTier,
  LINK_REGEX,
  SENDING_WINDOW_START_UTC,
  SENDING_WINDOW_END_UTC,
} from './tiers';

/**
 * SafeModeManager
 *
 * Central coordinator for all Safe Mode decisions. One shared instance
 * should be created at application startup and injected wherever sockets
 * are created.
 *
 * Thread-safety: all operations go through the async store (Redis or Memory)
 * which handles concurrent access correctly via atomic INCR operations.
 */
export class SafeModeManager {
  constructor(private readonly store: ISafeModeStore) {}

  /**
   * Enable Safe Mode for a phone number.
   * If `tier` is omitted the number starts at Tier 1.
   * Safe to call multiple times — idempotent if already enabled at same tier.
   */
  async enable(phoneId: string, tier: SafeModeTier = 1): Promise<void> {
    const alreadyEnabled = await this.store.isEnabled(phoneId);
    if (!alreadyEnabled) {
      await this.store.setStartedAt(phoneId, new Date().toISOString());
    }
    await this.store.setEnabled(phoneId, true);
    await this.store.setTier(phoneId, tier);
  }

  /**
   * Disable Safe Mode for a phone number.
   * All subsequent send operations pass through without checking.
   */
  async disable(phoneId: string): Promise<void> {
    await this.store.setEnabled(phoneId, false);
  }

  /**
   * Get a complete status snapshot for the given phone number.
   * Returns a safe default (enabled=false, tier=1) for unknown IDs.
   */
  async getStatus(phoneId: string): Promise<SafeModeStatus> {
    const [
      enabled,
      tier,
      startedAt,
      sentToday,
      newChatsToday,
      totalReplies,
      totalSent,
      lastSentAt,
    ] = await Promise.all([
      this.store.isEnabled(phoneId),
      this.store.getTier(phoneId),
      this.store.getStartedAt(phoneId),
      this.store.getSentToday(phoneId),
      this.store.getNewChatsToday(phoneId),
      this.store.getTotalReplies(phoneId),
      this.store.getTotalSent(phoneId),
      this.store.getLastSentAt(phoneId),
    ]);

    const config = getTierConfig(tier);
    const day = startedAt ? this._dayCount(startedAt) : 1;
    const replyRate = totalSent > 0 ? totalReplies / totalSent : 0;

    return {
      phoneId,
      enabled,
      tier,
      startedAt,
      day,
      sentToday,
      dailyCap: config.dailyCap,
      newChatsToday,
      newChatsPerDayCap: config.newChatsPerDay,
      totalReplies,
      totalSent,
      replyRate,
      lastSentAt,
    };
  }

  /**
   * Check all Safe Mode rules for an outgoing operation and record it if allowed.
   *
   * Throws `SafeModeError` on any violation:
   *   F13 — link in first message to this recipient
   *   F14 — daily cap exceeded or outside sending window
   *   F15 — group action blocked
   *
   * If Safe Mode is disabled for this phoneId, resolves immediately without
   * any checks or recording.
   */
  async checkAndRecord(phoneId: string, payload: SendPayload): Promise<void> {
    const enabled = await this.store.isEnabled(phoneId);
    if (!enabled) return; // Safe Mode off — pass through

    const tier = await this.store.getTier(phoneId);
    const config = getTierConfig(tier);

    // ── Group action check (F15) ────────────────────────────────────────
    if (payload.isGroupCreate || payload.isGroupUpdate) {
      if (config.blockGroupActions) {
        throw new SafeModeError(
          'F15',
          `Group actions are blocked until Tier 3 (currently Tier ${tier}). ` +
          `Safe Mode must warm up more before group operations are allowed.`
        );
      }
    }

    // ── Sending window check (F14) ──────────────────────────────────────
    const utcHour = new Date().getUTCHours();
    if (utcHour < SENDING_WINDOW_START_UTC || utcHour >= SENDING_WINDOW_END_UTC) {
      throw new SafeModeError(
        'F14',
        `Outside allowed sending window (${SENDING_WINDOW_START_UTC}:00 – ` +
        `${SENDING_WINDOW_END_UTC}:00 UTC). Current UTC hour: ${utcHour}.`
      );
    }

    // ── Daily cap check (F14) ───────────────────────────────────────────
    if (config.dailyCap !== undefined) {
      const sentToday = await this.store.getSentToday(phoneId);
      if (sentToday >= config.dailyCap) {
        throw new SafeModeError(
          'F14',
          `Daily send cap of ${config.dailyCap} reached for Tier ${tier}. ` +
          `Counter resets at UTC midnight.`
        );
      }
    }

    // ── New chat cap check (F14) ────────────────────────────────────────
    const isNewChat = !(await this.store.hasSeenJid(phoneId, payload.toJid));
    if (isNewChat && config.newChatsPerDay !== undefined) {
      const newChatsToday = await this.store.getNewChatsToday(phoneId);
      if (newChatsToday >= config.newChatsPerDay) {
        throw new SafeModeError(
          'F14',
          `New-chat cap of ${config.newChatsPerDay}/day reached for Tier ${tier}. ` +
          `You can only message existing contacts until midnight UTC.`
        );
      }
    }

    // ── Min-gap check (F14) ─────────────────────────────────────────────
    const lastSentAt = await this.store.getLastSentAt(phoneId);
    if (lastSentAt !== null) {
      const elapsedMs = Date.now() - lastSentAt;
      if (elapsedMs < config.minGapMs) {
        const waitMs = config.minGapMs - elapsedMs;
        throw new SafeModeError(
          'F14',
          `Minimum message gap of ${config.minGapMs / 1000}s not met. ` +
          `Wait ${Math.ceil(waitMs / 1000)}s more before sending.`
        );
      }
    }

    // ── Link in first message check (F13) ───────────────────────────────
    if (isNewChat && config.blockLinkInFirstMessage && payload.text) {
      if (LINK_REGEX.test(payload.text)) {
        throw new SafeModeError(
          'F13',
          `Links are blocked in first messages to new contacts at Tier ${tier}. ` +
          `Remove all URLs/links from this message or contact this recipient first without a link.`
        );
      }
    }

    // ── All checks passed — record the send ────────────────────────────
    const [, , totalSent] = await Promise.all([
      this.store.incrementSentToday(phoneId),
      isNewChat ? this.store.incrementNewChatsToday(phoneId) : Promise.resolve(0),
      this.store.incrementTotalSent(phoneId),
    ]);

    await Promise.all([
      this.store.setLastSentAt(phoneId, Date.now()),
      isNewChat ? this.store.markJidSeen(phoneId, payload.toJid) : Promise.resolve(),
    ]);

    // ── Advance tier if eligible (async, non-blocking to send) ──────────
    this._maybeAdvanceTier(phoneId, tier, totalSent).catch(() => {});
  }

  /**
   * Record that a reply was received from a JID. Called automatically by
   * wrapBaileysSocket on messages.upsert (incoming messages from others).
   */
  async recordReply(phoneId: string, fromJid: string): Promise<void> {
    const enabled = await this.store.isEnabled(phoneId);
    if (!enabled) return;
    await this.store.incrementReplies(phoneId);
  }

  /**
   * Advance the tier if the current tier's duration and reply rate thresholds
   * are met. Safe to call at any time — reads current state and only writes
   * if advancement is warranted.
   */
  async advanceTierIfEligible(phoneId: string): Promise<SafeModeTier | null> {
    const [currentTier, startedAt, totalReplies, totalSent] = await Promise.all([
      this.store.getTier(phoneId),
      this.store.getStartedAt(phoneId),
      this.store.getTotalReplies(phoneId),
      this.store.getTotalSent(phoneId),
    ]);

    const dayCount = startedAt ? this._dayCount(startedAt) : 1;
    const replyRate = totalSent > 0 ? totalReplies / totalSent : 0;

    // Compute cumulative day count for current tier progression
    const daysInCurrentTier = this._daysInCurrentTier(currentTier, dayCount);
    const nextTier = computeNextTier(currentTier, daysInCurrentTier, replyRate);

    if (nextTier !== currentTier) {
      await this.store.setTier(phoneId, nextTier);
      return nextTier;
    }
    return null;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Calendar day count since startedAt (1-based) */
  private _dayCount(startedAt: string): number {
    const startMs = new Date(startedAt).getTime();
    const nowMs = Date.now();
    return Math.max(1, Math.floor((nowMs - startMs) / (24 * 3600 * 1000)) + 1);
  }

  /** Days elapsed within the current tier (for tier advancement logic) */
  private _daysInCurrentTier(tier: SafeModeTier, totalDays: number): number {
    let accumulatedDays = 0;
    for (let t = 1; t < tier; t++) {
      const cfg = getTierConfig(t as SafeModeTier);
      accumulatedDays += cfg.durationDays ?? 0;
    }
    return Math.max(1, totalDays - accumulatedDays);
  }

  /** Non-throwing tier advance, called after successful send */
  private async _maybeAdvanceTier(
    phoneId: string,
    currentTier: SafeModeTier,
    totalSent: number
  ): Promise<void> {
    // Only check every 10 sends to reduce Redis round-trips
    if (totalSent % 10 !== 0) return;
    await this.advanceTierIfEligible(phoneId);
  }
}
