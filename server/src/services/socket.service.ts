import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { hashToken } from '../utils/crypto';

let io: SocketIOServer | null = null;

/**
 * Initialize the Socket.io server, attaching it to the given HTTP server.
 * Call once during bootstrap.
 */
export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || '';
      const token = cookie.match(/(?:^|;\\s*)wa_token=([^;]+)/)?.[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(decodeURIComponent(token), env.JWT_SECRET) as jwt.JwtPayload;
      const session = await Session.findOne({ tokenHash: hashToken(decodeURIComponent(token)), isRevoked: false });
      const user = decoded.sub ? await User.findById(decoded.sub).select('isActive') : null;
      if (!session || !user?.isActive) return next(new Error('Invalid session'));

      socket.data.instanceId = user._id.toString();
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket] Client connected: ${socket.id}`);
    socket.join(`instance:${socket.data.instanceId}`);

    socket.on('disconnect', () => {
      logger.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  logger.info('[Socket] Socket.io server initialized');
  return io;
}

/**
 * Return the singleton IO instance.
 * Throws if initSocket() has not been called yet.
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('[Socket] Socket.io not initialized. Call initSocket() first.');
  }
  return io;
}

// ── Typed event emitters ────────────────────────────────────────────────────

export interface ChatbotLeadMessagePayload {
  leadId: string;
  instanceId: string;
  sessionId: string;
  domain: string;
  message: { sender: 'user' | 'bot' | 'agent'; text: string; timestamp: string };
  capturedData?: { name?: string; email?: string; phone?: string };
}

/**
 * Emit a new chatbot lead message to all connected dashboard clients
 * watching a specific instance room.
 */
export function emitLeadMessage(payload: ChatbotLeadMessagePayload): void {
  try {
    const ioServer = getIO();
    // Never broadcast account data outside the owning instance room.
    ioServer.to(`instance:${payload.instanceId}`).emit('chatbot:lead:message', payload);
  } catch {
    // Non-fatal — socket may not be initialized in test environments
  }
}

export interface ChatbotStatusPayload {
  instanceId: string;
  enabled: boolean;
}

/**
 * Emit chatbot online/offline status change.
 */
export function emitChatbotStatus(payload: ChatbotStatusPayload): void {
  try {
    const ioServer = getIO();
    ioServer.to(`instance:${payload.instanceId}`).emit('chatbot:status', payload);
  } catch {
    // Non-fatal
  }
}
