import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

export interface SocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: SocketOptions = { autoConnect: true }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token || !options.autoConnect) {
      return;
    }

    // Create socket connection
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [token, options.autoConnect]);

  const subscribeToContent = (contentId: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('subscribeToContent', contentId);
    console.log(`[WebSocket] Subscribed to content:${contentId}`);
  };

  const unsubscribeFromContent = (contentId: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('unsubscribeFromContent', contentId);
    console.log(`[WebSocket] Unsubscribed from content:${contentId}`);
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    
    socketRef.current.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    subscribeToContent,
    unsubscribeFromContent,
    on,
    off,
  };
}
