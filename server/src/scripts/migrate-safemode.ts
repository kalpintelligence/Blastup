/**
 * migrate-safemode.ts
 *
 * One-off migration script to configure Safe Mode for existing live numbers.
 *
 * Usage:
 *   npx ts-node src/scripts/migrate-safemode.ts [--execute]
 *
 * By default (no flags) this runs in DRY-RUN mode — it prints recommendations
 * but makes NO changes. Pass --execute to apply changes.
 *
 * Heuristics:
 *   - messagesSent > 5000 AND account > 90 days old → recommend: SKIP (leave SM off)
 *   - Previously had error/banned status OR messagesSent < 100 → Tier 1, enable
 *   - messagesSent 100-5000 AND < 90 days old → Tier 2, enable
 *   - messagesSent > 5000 AND < 90 days old → Tier 3, enable
 *   - Otherwise (old + high volume) → recommend: SKIP (operator decides)
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env
const localEnv = path.join(process.cwd(), '.env');
const rootEnv = path.join(process.cwd(), '..', '.env');
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });

import mongoose from 'mongoose';
import { WhatsAppInstance } from '../models/WhatsAppInstance';
import { Log } from '../models/Log';
import { getRedisClient } from '../config/redis';
import { RedisSafeModeStore } from '../safemode/stores/RedisSafeModeStore';
import { SafeModeManager } from '../safemode/SafeModeManager';
import { SafeModeTier } from '../safemode/types';

const IS_EXECUTE = process.argv.includes('--execute');

interface Recommendation {
  instanceId: string;
  phone: string | null;
  status: string;
  messagesSent: number;
  agedays: number;
  action: 'skip' | 'enable';
  tier: SafeModeTier | null;
  reason: string;
}

async function main() {
  console.log('\n🛡️  Safe Mode Migration Script');
  console.log('==============================');
  console.log(`Mode: ${IS_EXECUTE ? '⚠️  EXECUTE (will make changes)' : '🔍 DRY-RUN (read-only)'}\n`);

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ Connected to MongoDB');

  const instances = await WhatsAppInstance.find().lean();
  console.log(`📊 Found ${instances.length} instances\n`);

  const recommendations: Recommendation[] = [];

  for (const inst of instances) {
    const ageDays = Math.floor(
      (Date.now() - new Date(inst.createdAt).getTime()) / (24 * 3600 * 1000)
    );
    const messagesSent = inst.messagesSent || 0;

    // Check for any error/ban-related logs
    const hadErrors = await Log.exists({
      instanceId: inst.instanceId,
      level: { $in: ['error', 'warn'] },
      message: { $regex: /ban|restrict|block|suspended/i },
    });

    let action: 'skip' | 'enable';
    let tier: SafeModeTier | null = null;
    let reason: string;

    if (hadErrors) {
      action = 'enable';
      tier = 1;
      reason = 'Had ban/restrict-related errors in logs → Tier 1, no exceptions';
    } else if (messagesSent < 100) {
      action = 'enable';
      tier = 1;
      reason = 'Low volume / new number → Tier 1 warm-up';
    } else if (messagesSent >= 5000 && ageDays >= 90) {
      action = 'skip';
      reason = 'High volume, mature account → leave Safe Mode off (review manually)';
    } else if (messagesSent >= 5000 && ageDays < 90) {
      action = 'enable';
      tier = 3;
      reason = 'High volume but relatively new → Tier 3';
    } else if (messagesSent >= 100 && ageDays >= 30) {
      action = 'enable';
      tier = 2;
      reason = 'Moderate volume, established account → Tier 2';
    } else {
      action = 'enable';
      tier = 1;
      reason = 'Unknown/uncertain pattern → Tier 1 (safe default)';
    }

    recommendations.push({
      instanceId: inst.instanceId,
      phone: inst.phone,
      status: inst.status,
      messagesSent,
      agedays: ageDays,
      action,
      tier,
      reason,
    });
  }

  // Print recommendation table
  console.log('📋 Recommendations:\n');
  console.log(
    'Instance ID'.padEnd(24) +
    'Phone'.padEnd(18) +
    'Status'.padEnd(14) +
    'Msgs Sent'.padEnd(12) +
    'Age (d)'.padEnd(10) +
    'Action'.padEnd(10) +
    'Tier'.padEnd(6) +
    'Reason'
  );
  console.log('─'.repeat(130));

  for (const r of recommendations) {
    console.log(
      r.instanceId.padEnd(24) +
      (r.phone || 'unknown').padEnd(18) +
      r.status.padEnd(14) +
      String(r.messagesSent).padEnd(12) +
      String(r.agedays).padEnd(10) +
      r.action.toUpperCase().padEnd(10) +
      (r.tier ? String(r.tier) : '-').padEnd(6) +
      r.reason
    );
  }

  const enableCount = recommendations.filter((r) => r.action === 'enable').length;
  const skipCount = recommendations.filter((r) => r.action === 'skip').length;

  console.log(`\n📊 Summary: ${enableCount} to ENABLE, ${skipCount} to SKIP\n`);

  if (!IS_EXECUTE) {
    console.log('ℹ️  Dry-run complete. Run with --execute to apply changes.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Execute changes ────────────────────────────────────────────────────
  console.log('⚙️  Applying changes...\n');

  const redisClient = getRedisClient();
  const store = new RedisSafeModeStore(redisClient);
  const manager = new SafeModeManager(store);

  let applied = 0;
  let skipped = 0;

  for (const r of recommendations) {
    if (r.action === 'skip') {
      // Ensure SM is explicitly disabled in both Redis and MongoDB
      await manager.disable(r.instanceId);
      await WhatsAppInstance.findOneAndUpdate(
        { instanceId: r.instanceId },
        { safeModeEnabled: false, safeModeStartedAt: null, safeModeStartTier: null }
      );
      console.log(`  ⏭️  SKIP  ${r.instanceId} — ${r.reason}`);
      skipped++;
    } else if (r.action === 'enable' && r.tier) {
      await manager.enable(r.instanceId, r.tier);
      await WhatsAppInstance.findOneAndUpdate(
        { instanceId: r.instanceId },
        {
          safeModeEnabled: true,
          safeModeStartedAt: new Date(),
          safeModeStartTier: r.tier,
        }
      );
      console.log(`  ✅ ENABLE ${r.instanceId} @ Tier ${r.tier} — ${r.reason}`);
      applied++;
    }
  }

  console.log(`\n✅ Done. Applied: ${applied}, Skipped: ${skipped}`);

  await mongoose.disconnect();
  await redisClient.quit();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
