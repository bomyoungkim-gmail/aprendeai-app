'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket, getAuthToken } from '@/lib/websocket/socket';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  joinSession: () => {},
  leaveSession: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const activeSessionIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const newSocket = createSocket(token);
    
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected:', newSocket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempts(0);

      // Re-join active session on reconnect
      if (activeSessionIdRef.current) {
        console.log('[WebSocket] Re-joining session after reconnect:', activeSessionIdRef.current);
        newSocket.emit('joinSession', { sessionId: activeSessionIdRef.current });
        
        // Sync state by invalidating queries
        queryClient.invalidateQueries({ queryKey: ['session', activeSessionIdRef.current] });
        queryClient.invalidateQueries({ queryKey: ['events', activeSessionIdRef.current] });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setIsReconnecting(true);
    });

    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnection attempt:', attempt);
      setReconnectAttempts(attempt);
      setIsReconnecting(true);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after max attempts');
      setIsReconnecting(false);
      // User can still use app, queries will work via HTTP
    });

    newSocket.io.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      setIsReconnecting(false);
      setReconnectAttempts(0);
    });

    // Connect
    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [queryClient]);

  const joinSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      console.log('[WebSocket] Joining session:', sessionId);
      socket.emit('joinSession', { sessionId });
      activeSessionIdRef.current = sessionId;
    }
  }, [socket, isConnected]);

  const leaveSession = useCallback((sessionId: string) => {
    if (socket && isConnected) {
      console.log('[WebSocket] Leaving session:', sessionId);
      socket.emit('leaveSession', { sessionId });
      activeSessionIdRef.current = null;
    }
  }, [socket, isConnected]);

  return (
    <WebSocketContext.Provider value={{ 
      socket, 
      isConnected, 
      isReconnecting, 
      reconnectAttempts,
      joinSession, 
      leaveSession 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
