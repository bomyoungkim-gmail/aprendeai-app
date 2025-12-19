'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket, getAuthToken } from '@/lib/websocket/socket';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  joinSession: () => {},
  leaveSession: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const newSocket = createSocket(token);
    
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    // Connect
    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      console.log('[WebSocket] Joining session:', sessionId);
      socket.emit('joinSession', { sessionId });
    }
  }, [socket, isConnected]);

  const leaveSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      console.log('[WebSocket] Leaving session:', sessionId);
      socket.emit('leaveSession', { sessionId });
    }
  }, [socket, isConnected]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, joinSession, leaveSession }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
