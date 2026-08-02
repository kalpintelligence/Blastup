import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('✅ MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { err });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected, attempting to reconnect...');
  });

  await attemptConnection();
}

async function attemptConnection(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    retryCount = 0;
  } catch (error) {
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      logger.warn(`MongoDB connection attempt ${retryCount}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return attemptConnection();
    }
    logger.error('Failed to connect to MongoDB after maximum retries');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}
