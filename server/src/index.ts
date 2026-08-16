import { createApp } from './app';
import { connectDatabase } from './config/database';
import { initWhatsApp } from './services/whatsapp.service';
import { logger } from './config/logger';
import { env } from './config/env';
import { getSafeModeManager } from './config/safemode';
import { disconnectRedis } from './config/redis';
import { initSocket } from './services/socket.service';
import http from 'http';

// libsignal writes full cryptographic session objects directly to console for
// recoverable ratchet changes. Keep operational logs readable without hiding
// unrelated warnings or errors.
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);
const isSignalSessionNoise = (args: unknown[]) => {
  const first = String(args[0] || '');
  return first.startsWith('Closing open session') || first.startsWith('Closing session:') || first.startsWith('Session error:Error: Bad MAC');
};
console.warn = (...args: unknown[]) => { if (!isSignalSessionNoise(args)) originalConsoleWarn(...args); };
console.error = (...args: unknown[]) => { if (!isSignalSessionNoise(args)) originalConsoleError(...args); };

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('Database connected');

    // Initialize Safe Mode Manager (Redis-backed in production)
    getSafeModeManager();

    // Reset hanging statuses from previous crash
    const { WhatsAppInstance } = await import('./models/WhatsAppInstance');
    await WhatsAppInstance.updateMany(
      { status: { $in: ['connecting', 'qr_ready'] } },
      { $set: { status: 'disconnected', qrCode: null, qrExpiresAt: null } }
    );

    // Create Express app
    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.io
    initSocket(server);

    // Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`📚 API Docs: http://localhost:${env.PORT}/api/docs`);
    });

    // Auto-resume previously connected sessions
    const activeInstances = await WhatsAppInstance.find({ status: 'connected' }).sort({ lastConnectedAt: -1 });
    const activePhones = new Set<string>();
    const instancesToResume = [];
    for (const inst of activeInstances) {
      if (inst.phone && activePhones.has(inst.phone)) {
        await WhatsAppInstance.updateOne(
          { _id: inst._id },
          { $set: { status: 'disconnected', lastDisconnectedAt: new Date() } }
        );
        logger.warn(`Skipped duplicate WhatsApp session for ${inst.phone}`, { instanceId: inst.instanceId });
        continue;
      }
      if (inst.phone) activePhones.add(inst.phone);
      instancesToResume.push(inst);
    }
    for (const inst of instancesToResume) {
      initWhatsApp(inst.instanceId).catch((err) => {
        logger.error(`WhatsApp auto-resume error for ${inst.instanceId}`, { err });
      });
    }

    // ── Graceful Shutdown ────────────────────────────────────────
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        try {
          const { disconnectDatabase } = await import('./config/database');
          await disconnectDatabase();
          await disconnectRedis();
          logger.info('Shutdown complete');
          process.exit(0);
        } catch {
          process.exit(1);
        }
      });

      // Force close after 30s
      setTimeout(() => {
        logger.error('Force shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled rejections — log but don't crash
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
