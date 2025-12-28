/**
 * WebSocket Singleton Service
 * 
 * Centralized WebSocket management to replace WebSocketContext.
 * Singleton pattern ensures single connection.
 */

import { Socket, io } from 'socket.io-client';
import { storageService } from '../storage/storage.service';

// ========================================
// TYPE
// ========================================

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
}

// ========================================
// SERVICE
// ========================================

class WebSocketService {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private activeSessionId: string | null = null;

  /**
   * Initialize WebSocket connection
   */
  initialize(config: WebSocketConfig) {
    if (this.socket) {
      console.warn('[WebSocket] Already initialized');
      return;
    }

    const token = storageService.get('authToken');
    if (!token) {
      console.warn('[WebSocket] No auth token, skipping connection');
      return;
    }

    this.socket = io(config.url, {
      auth: { token },
      autoConnect: config.autoConnect !== false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();

    if (config.autoConnect !== false) {
      this.connect();
    }
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
      this.status = 'connected';
      this.reconnectAttempts = 0;

      // Re-join active session on reconnect
      if (this.activeSessionId) {
        this.joinSession(this.activeSessionId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.status = 'disconnected';
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.status = 'connecting';
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnect attempt:', attempt);
      this.status = 'reconnecting';
      this.reconnectAttempts = attempt;
    });

    this.socket.io.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      this.status = 'connected';
      this.reconnectAttempts = 0;
    });
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (!this.socket) {
      throw new Error('[WebSocket] Not initialized. Call initialize() first.');
    }

    if (this.socket.connected) {
      console.warn('[WebSocket] Already connected');
      return;
    }

    this.status = 'connecting';
    this.socket.connect();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (!this.socket) return;

    this.socket.disconnect();
    this.status = 'disconnected';
  }

  /**
   * Join a session room
   */
  joinSession(sessionId: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('[WebSocket] Cannot join session - not connected');
      return;
    }

    console.log('[WebSocket] Joining session:', sessionId);
    this.socket.emit('joinSession', { sessionId });
    this.activeSessionId = sessionId;
  }

  /**
   * Leave a session room
   */
  leaveSession(sessionId: string) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    console.log('[WebSocket] Leaving session:', sessionId);
    this.socket.emit('leaveSession', { sessionId });
    this.activeSessionId = null;
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: any) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`[WebSocket] Cannot emit "${event}" - not connected`);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn(`[WebSocket] Cannot subscribe to "${event}" - not initialized`);
      return () => {};
    }

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) return;

    this.socket.off(event, callback);
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get reconnect attempts
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Cleanup (call on app unmount)
   */
  cleanup() {
    if (!this.socket) return;

    // Remove all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.off(event, callback);
      });
    });
    this.listeners.clear();

    this.disconnect();
    this.socket = null;
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

export const websocketService = new WebSocketService();
