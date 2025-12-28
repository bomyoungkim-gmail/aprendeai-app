/**
 * WebSocket Service Tests
 * 
 * Comprehensive tests for singleton WebSocket service
 */

import { Socket } from 'socket.io-client';
import { websocketService } from '@/services/websocket/websocket.service';
import { storageService } from '@/services/storage/storage.service';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mSocket = {
    auth: {},
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    io: {
      on: jest.fn(),
    },
  };
  return {
    io: jest.fn(() => mSocket),
  };
});

// Mock storage service
jest.mock('@/services/storage/storage.service', () => ({
  storageService: {
    get: jest.fn(),
  },
}));

describe('WebSocketService', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Reset singleton state (hacky for singleton testing)
    (websocketService as any).socket = null;
    (websocketService as any).status = 'disconnected';
    (websocketService as any).listeners.clear();
    (websocketService as any).activeSessionId = null;

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup socket mock return
    const io = require('socket.io-client').io;
    mockSocket = io();
  });

  describe('Initialize', () => {
    it('should initialize connection with token', () => {
      (storageService.get as jest.Mock).mockReturnValue('valid-token');
      
      websocketService.initialize({ url: 'http://test.com' });

      const io = require('socket.io-client').io;
      expect(io).toHaveBeenCalledWith('http://test.com', expect.objectContaining({
        auth: { token: 'valid-token' },
        autoConnect: true,
      }));
      expect(websocketService.getStatus()).toBe('connecting');
    });

    it('should not initialize without token', () => {
      (storageService.get as jest.Mock).mockReturnValue(null);
      
      websocketService.initialize({ url: 'http://test.com' });

      const io = require('socket.io-client').io;
      // Should verify io was NOT called a second time (first was in beforeEach)
      // But mockSocket is created in beforeEach by calling io()
      // So checking call count > 1
      expect(io).toHaveBeenCalledTimes(1); 
    });

    it('should not initialize if already initialized', () => {
      (storageService.get as jest.Mock).mockReturnValue('valid-token');
      
      websocketService.initialize({ url: 'http://test.com' });
      websocketService.initialize({ url: 'http://test.com' });

      // expect(console.warn).toHaveBeenCalled(); // If we mocked console
      const io = require('socket.io-client').io;
      expect(io).toHaveBeenCalledTimes(2); // Once for beforeEach, once for first init
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      (storageService.get as jest.Mock).mockReturnValue('valid-token');
      websocketService.initialize({ url: 'http://test.com', autoConnect: false });
    });

    it('should connect when connect() is called', () => {
      websocketService.connect();
      expect(mockSocket.connect).toHaveBeenCalled();
      expect(websocketService.getStatus()).toBe('connecting');
    });

    it('should disconnect when disconnect() is called', () => {
        // First simulate connection
        websocketService.connect();
        (websocketService as any).socket = mockSocket; // Ensure socket is set
        
        websocketService.disconnect();
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(websocketService.getStatus()).toBe('disconnected');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      (storageService.get as jest.Mock).mockReturnValue('valid-token');
      websocketService.initialize({ url: 'http://test.com' });
      // Simulate connected state
      mockSocket.connected = true;
    });

    it('should emit joinSession event', () => {
      websocketService.joinSession('session-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joinSession', { sessionId: 'session-123' });
    });

    it('should emit leaveSession event', () => {
      websocketService.leaveSession('session-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('leaveSession', { sessionId: 'session-123' });
    });
  });

  describe('Events', () => {
    beforeEach(() => {
      (storageService.get as jest.Mock).mockReturnValue('valid-token');
      websocketService.initialize({ url: 'http://test.com' });
      mockSocket.connected = true;
    });

    it('should emit custom event', () => {
      websocketService.emit('custom-event', { data: 123 });
      expect(mockSocket.emit).toHaveBeenCalledWith('custom-event', { data: 123 });
    });

    it('should subscribe to event', () => {
      const callback = jest.fn();
      websocketService.on('test-event', callback);
      expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback);
    });

    it('should unsubscribe from event', () => {
      const callback = jest.fn();
      const unsubscribe = websocketService.on('test-event', callback);
      
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback);
    });
  });
});
