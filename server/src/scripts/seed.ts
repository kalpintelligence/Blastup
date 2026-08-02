/**
 * Seed Script: Creates the first admin user from environment variables.
 * Run once: npx ts-node src/scripts/seed.ts
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function seed() {
  await connectDatabase();

  const existing = await User.findOne({ username: env.ADMIN_USERNAME });

  if (existing) {
    logger.info(`Admin user "${env.ADMIN_USERNAME}" already exists. Skipping.`);
    await disconnectDatabase();
    return;
  }

  const admin = new User({
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD, // Will be hashed by pre-save hook
    role: 'admin',
    isActive: true,
  });

  await admin.save();

  logger.info(`✅ Admin user "${env.ADMIN_USERNAME}" created successfully.`);
  logger.info('Please change the password after first login!');

  await disconnectDatabase();
}

seed().catch((err) => {
  logger.error('Seed failed', { err });
  process.exit(1);
});
