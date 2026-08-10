import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { logger } from '../config/logger';

let io: SocketIOServer | null = null;

/**
 * Initialize the Socket.io server, attaching it to the given HTTP server.
 * Call once during bootstrap.
 */
export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket] Client connected: ${socket.id}`);

    // Allow dashboard clients to join a room keyed by instanceId
    socket.on('join', (instanceId: string) => {
      socket.join(`instance:${instanceId}`);
      logger.info(`[Socket] ${socket.id} joined room instance:${instanceId}`);
    });

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
    // Emit to the specific instance room AND globally (for clients not yet in a room)
    ioServer.to(`instance:${payload.instanceId}`).emit('chatbot:lead:message', payload);
    ioServer.emit('chatbot:lead:message', payload);
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
    ioServer.emit('chatbot:status', payload);
  } catch {
    // Non-fatal
  }
}
