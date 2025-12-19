import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SOCKET_NAMESPACE = '/study-groups';

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
