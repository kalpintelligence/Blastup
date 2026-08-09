import { getTierConfig, computeNextTier, TIER_CONFIGS } from '../tiers';
import { SafeModeTier } from '../types';

describe('Safe Mode Tiers', () => {
  describe('getTierConfig', () => {
    it('should return correct configuration for each tier', () => {
      const tier1 = getTierConfig(1);
      expect(tier1.tier).toBe(1);
      expect(tier1.dailyCap).toBe(10);
      expect(tier1.blockLinkInFirstMessage).toBe(true);

      const tier5 = getTierConfig(5);
      expect(tier5.tier).toBe(5);
      expect(tier5.dailyCap).toBeUndefined();
      expect(tier5.blockLinkInFirstMessage).toBe(false);
    });
  });

  describe('computeNextTier', () => {
    it('should not advance if at tier 5', () => {
      expect(computeNextTier(5, 10, 0.5)).toBe(5);
    });

    it('should not advance if dayCount is less than durationDays', () => {
      const config = TIER_CONFIGS[1];
      const minDays = config.durationDays || 3;
      expect(computeNextTier(1, minDays - 1, 0.5)).toBe(1);
    });

    it('should not advance if replyRate is lower than threshold', () => {
      const config = TIER_CONFIGS[1];
      const minDays = config.durationDays || 3;
      expect(computeNextTier(1, minDays, config.minReplyRate - 0.01)).toBe(1);
    });

    it('should advance to next tier if all requirements are met', () => {
      const config = TIER_CONFIGS[1];
      const minDays = config.durationDays || 3;
      expect(computeNextTier(1, minDays, config.minReplyRate)).toBe(2);
      expect(computeNextTier(1, minDays + 5, config.minReplyRate + 0.1)).toBe(2);
    });
  });
});
