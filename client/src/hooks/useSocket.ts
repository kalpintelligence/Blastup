import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001');

    const socketIo = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    setSocket(socketIo);

    socketIo.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to server:', socketIo.id);
    });

    socketIo.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from server');
    });

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
  };
}
