import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CornellStorage, CornellSync } from '../src/cornell-storage';

// Mock Chrome API
const mockStorage = new Map();

const mockChrome = {
  storage: {
    local: {
      get: vi.fn(async (key) => {
        return { [key]: mockStorage.get(key) };
      }),
      set: vi.fn(async (data) => {
        Object.entries(data).forEach(([key, value]) => {
          mockStorage.set(key, value);
        });
      }),
      remove: vi.fn(async (key) => {
        mockStorage.delete(key);
      }),
    },
  },
};

// @ts-ignore
global.chrome = mockChrome;

describe('CornellStorage', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('savePendingNote', () => {
    it('should save note to pending queue', async () => {
      await CornellStorage.savePendingNote({
        type: 'highlight',
        text: 'Test note',
        url: 'https://example.com',
      });

      const pending = await CornellStorage.getPendingNotes();
      
      expect(pending).toHaveLength(1);
      expect(pending[0].type).toBe('highlight');
      expect(pending[0].text).toBe('Test note');
      expect(pending[0].synced).toBe(false);
    });

    it('should assign temporary ID to pending note', async () => {
      await CornellStorage.savePendingNote({
        type: 'question',
        text: 'Why?',
        url: 'https://example.com',
      });

      const pending = await CornellStorage.getPendingNotes();
      
      expect(pending[0].id).toMatch(/^temp_/);
    });

    it('should add note to cache for immediate display', async () => {
      const url = 'https://example.com';
      
      await CornellStorage.savePendingNote({
        type: 'note',
        text: 'Important',
        url,
      });

      const cached = await CornellStorage.getCachedNotes(url);
      
      expect(cached).toHaveLength(1);
      expect(cached[0].text).toBe('Important');
    });
  });

  describe('markSynced', () => {
    it('should remove from pending and update ID', async () => {
      await CornellStorage.savePendingNote({
        type: 'highlight',
        text: 'Test',
        url: 'https://example.com',
      });

      const pending = await CornellStorage.getPendingNotes();
      const tempId = pending[0].id!;
      
      await CornellStorage.markSynced(tempId, 'server-id-123');
      
      const updatedPending = await CornellStorage.getPendingNotes();
      expect(updatedPending).toHaveLength(0);
    });

    it('should update cached note with server ID', async () => {
      const url = 'https://example.com';
      
      await CornellStorage.savePendingNote({
        type: 'highlight',
        text: 'Test',
        url,
      });

      const pending = await CornellStorage.getPendingNotes();
      const tempId = pending[0].id!;
      
      await CornellStorage.markSynced(tempId, 'server-id-123');
      
      const cached = await CornellStorage.getCachedNotes(url);
      expect(cached[0].id).toBe('server-id-123');
      expect(cached[0].synced).toBe(true);
    });
  });

  describe('cacheNotes', () => {
    it('should store server notes in cache', async () => {
      const url = 'https://example.com';
      const serverNotes = [
        { id: '1', type: 'highlight', text: 'Note 1', url, createdAt: new Date(), synced: false },
        { id: '2', type: 'question', text: 'Note 2', url, createdAt: new Date(), synced: false },
      ];

      await CornellStorage.cacheNotes(url, serverNotes);
      
      const cached = await CornellStorage.getCachedNotes(url);
      
      expect(cached).toHaveLength(2);
      expect(cached[0].synced).toBe(true);
      expect(cached[1].synced).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all cached data', async () => {
      await CornellStorage.savePendingNote({
        type: 'highlight',
        text: 'Test',
        url: 'https://example.com',
      });

      await CornellStorage.clear();
      
      const pending = await CornellStorage.getPendingNotes();
      expect(pending).toHaveLength(0);
    });
  });
});

describe('CornellSync', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('syncPendingNotes', () => {
    it('should sync all pending notes to server', async () => {
      await CornellStorage.savePendingNote({
        type: 'highlight',
        text: 'Test 1',
        url: 'https://example.com',
      });

      await CornellStorage.savePendingNote({
        type: 'question',
        text: 'Test 2',
        url: 'https://example.com',
      });

      const mockApiClient = {
        createCornellNote: vi.fn().mockResolvedValue({ id: 'server-123' }),
      };

      await CornellSync.syncPendingNotes(mockApiClient);
      
      expect(mockApiClient.createCornellNote).toHaveBeenCalledTimes(2);
      
      const pending = await CornellStorage.getPendingNotes();
      expect(pending).toHaveLength(0);
    });

    it('should continue on individual note failures', async () => {
      await CornellStorage.savePendingNote({
        type: 'highlight',
        text: 'Test 1',
        url: 'https://example.com',
      });

      await CornellStorage.savePendingNote({
        type: 'question',
        text: 'Test 2',
        url: 'https://example.com',
      });

      const mockApiClient = {
        createCornellNote: vi.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ id: 'server-123' }),
      };

      await CornellSync.syncPendingNotes(mockApiClient);
      
      expect(mockApiClient.createCornellNote).toHaveBeenCalledTimes(2);
    });
  });
});
