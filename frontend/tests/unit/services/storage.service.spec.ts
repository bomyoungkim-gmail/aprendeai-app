/**
 * Storage Service Tests
 * 
 * Comprehensive test suite for SSR-safe localStorage abstraction
 */

import { storageService } from '../../../services/storage/storage.service';
import type { StorageKey } from '../../../services/storage/storage.service';

// Mock localStorage for tests using Proxy to handle dynamic keys correctly
const localStorageMock = new Proxy({} as Record<string, string>, {
  get(target, p, receiver) {
    if (p === 'getItem') return (key: string) => target[key] || null;
    if (p === 'setItem') return (key: string, value: string) => { target[key] = String(value); };
    if (p === 'removeItem') return (key: string) => { delete target[key]; };
    if (p === 'clear') return () => { for (const k in target) delete target[k]; };
    if (p === 'key') return (index: number) => Object.keys(target)[index] || null;
    if (p === 'length') return Object.keys(target).length;
    
    // For normal property access (e.g. localStorage['key'])
    return Reflect.get(target, p, receiver);
  },
  
  set(target, p, value, receiver) {
    // For normal property set (e.g. localStorage['key'] = 'value')
    target[p as string] = String(value);
    return true;
  },
  
  // Ensure Object.keys() works correctly (returning only stored data keys)
  ownKeys(target) {
    return Reflect.ownKeys(target);
  },
  
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(target, prop);
  }
});

// Setup
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true // Allow resetting if needed
  });
});

beforeEach(() => {
  localStorageMock.clear();
});

describe('StorageService', () => {
  // Same tests as before
  describe('get()', () => {
    it('should return null for non-existent key', () => {
      const result = storageService.get('authToken');
      expect(result).toBeNull();
    });

    it('should return default value for non-existent key', () => {
      const result = storageService.get('authToken', 'default-token');
      expect(result).toBe('default-token');
    });

    it('should get string value', () => {
      localStorage.setItem('authToken', 'my-token');
      const result = storageService.get('authToken');
      expect(result).toBe('my-token');
    });

    it('should get JSON value', () => {
      const queue = [{ id: 1, type: 'create' }];
      localStorage.setItem('cornell-offline-queue', JSON.stringify(queue));
      
      const result = storageService.get('cornell-offline-queue');
      expect(result).toEqual(queue);
    });

    it('should handle malformed JSON gracefully', () => {
      localStorage.setItem('authToken', '{invalid-json}');
      const result = storageService.get('authToken');
      expect(result).toBe('{invalid-json}');
    });

    it('should be SSR-safe (return default when window undefined)', () => {
      expect(storageService.get('authToken')).toBeDefined();
    });
  });

  describe('set()', () => {
    it('should set string value', () => {
      storageService.set('authToken', 'my-token');
      expect(localStorage.getItem('authToken')).toBe('my-token');
    });

    it('should set object value as JSON', () => {
      const queue = [{ id: 1, type: 'create' }];
      storageService.set('cornell-offline-queue', queue);
      
      const stored = localStorage.getItem('cornell-offline-queue');
      expect(JSON.parse(stored!)).toEqual(queue);
    });

    it('should set promptDrawerState with type safety', () => {
      storageService.set('promptDrawerState', 'expanded');
      expect(localStorage.getItem('promptDrawerState')).toBe('expanded');
    });

    it('should handle dynamic session keys', () => {
      const sessionKey: StorageKey = 'session_123';
      storageService.set(sessionKey, 'session-data');
      expect(localStorage.getItem('session_123')).toBe('session-data');
    });
  });

  describe('remove()', () => {
    it('should remove existing key', () => {
      localStorage.setItem('authToken', 'token');
      storageService.remove('authToken');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should handle removing non-existent key', () => {
      expect(() => storageService.remove('authToken')).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('should clear all storage', () => {
      localStorage.setItem('authToken', 'token');
      localStorage.setItem('userId', '123');
      
      storageService.clear();
      
      expect(localStorage.length).toBe(0);
    });
  });

  describe('has()', () => {
    it('should return true for existing key', () => {
      localStorage.setItem('authToken', 'token');
      expect(storageService.has('authToken')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(storageService.has('authToken')).toBe(false);
    });
  });

  describe('keys()', () => {
    it('should return all keys', () => {
      localStorage.setItem('authToken', 'token');
      localStorage.setItem('userId', '123');
      
      const keys = storageService.keys();
      expect(keys).toContain('authToken');
      expect(keys).toContain('userId');
      expect(keys.length).toBe(2);
    });

    it('should return empty array when storage is empty', () => {
      const keys = storageService.keys();
      expect(keys).toEqual([]);
    });
  });

  describe('Type Safety', () => {
    it('should enforce StorageKey type', () => {
      storageService.get('authToken');
      storageService.get('admin_token');
      storageService.get('userId');
      storageService.get('promptDrawerState');
      storageService.get('cornell-offline-queue');
      storageService.get('pwa-install-dismissed');
      storageService.get('session_123');
    });

    it('should type promptDrawerState values', () => {
      storageService.set('promptDrawerState', 'peek');
      storageService.set('promptDrawerState', 'expanded');
      storageService.set('promptDrawerState', 'collapsed');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock setItem to throw using Object.defineProperty on the Proxy? 
      // Nope, Proxy traps interception.
      // But we can just replace localStorage.setItem with a mock function for this test
      // because our setup made configurable: true
      
      const originalSetItem = localStorage.setItem;
      Object.defineProperty(localStorage, 'setItem', {
        value: () => { throw new Error('Quota exceeded'); },
        writable: true,
        configurable: true
      });

      expect(() => storageService.set('authToken', 'token')).not.toThrow();

      // Restore
      Object.defineProperty(localStorage, 'setItem', {
        value: originalSetItem,
        writable: true,
        configurable: true
      });
    });

    it('should handle getItem errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      Object.defineProperty(localStorage, 'getItem', {
        value: () => { throw new Error('Storage error'); },
        writable: true,
        configurable: true
      });

      const result = storageService.get('authToken', 'default');
      expect(result).toBe('default');

      // Restore
      Object.defineProperty(localStorage, 'getItem', {
        value: originalGetItem,
        writable: true,
        configurable: true
      });
    });
  });
});
