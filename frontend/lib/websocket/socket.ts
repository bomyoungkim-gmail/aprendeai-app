import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, WS_NAMESPACES } from '@/lib/config/api';

// Convert HTTP URL to WebSocket URL
const SOCKET_URL = API_BASE_URL.replace(/^http/, 'ws');
const SOCKET_NAMESPACE = WS_NAMESPACES.STUDY_GROUPS;

export function createSocket(token: string): Socket {
  return io(`${SOCKET_URL}${SOCKET_NAMESPACE}`, {
    auth: {
      token,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
