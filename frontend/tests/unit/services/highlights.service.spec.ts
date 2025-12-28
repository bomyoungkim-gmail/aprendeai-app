/**
 * Highlights Service Tests
 * 
 * Comprehensive tests for Cornell Notes highlighting functionality
 * Covers online/offline scenarios and queue integration
 */

import { highlightsService } from '@/services/cornell/highlights.service';
import { cornellApi } from '@/services/api/cornell.api';
import { offlineQueue } from '@/lib/cornell/offline-queue';

// Mock dependencies
jest.mock('@/services/api/cornell.api', () => ({
  cornellApi: {
    createHighlight: jest.fn(),
    updateHighlight: jest.fn(),
    deleteHighlight: jest.fn(),
    updateHighlightVisibility: jest.fn(),
  },
}));

jest.mock('@/lib/cornell/offline-queue', () => ({
  offlineQueue: {
    add: jest.fn(),
  },
}));

describe('HighlightsService', () => {
  const contentId = 'content-123';
  const highlightId = 'highlight-123';
  const mockPayload = { text: 'Test highlight', color: 'yellow' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHighlight', () => {
    it('should call API when online', async () => {
      const mockResponse = { id: highlightId, ...mockPayload };
      (cornellApi.createHighlight as jest.Mock).mockResolvedValue(mockResponse);

      const result = await highlightsService.createHighlight(
        contentId,
        mockPayload as any,
        { isOnline: true }
      );

      expect(cornellApi.createHighlight).toHaveBeenCalledWith(contentId, mockPayload);
      expect(offlineQueue.add).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should add to offline queue when offline', async () => {
      await highlightsService.createHighlight(
        contentId,
        mockPayload as any,
        { isOnline: false }
      );

      expect(cornellApi.createHighlight).not.toHaveBeenCalled();
      expect(offlineQueue.add).toHaveBeenCalledWith({
        type: 'CREATE_HIGHLIGHT',
        contentId,
        data: mockPayload,
      });
    });

    it('should return optimistic response when offline', async () => {
      const result = await highlightsService.createHighlight(
        contentId,
        mockPayload as any,
        { isOnline: false }
      );

      expect(result).toMatchObject(mockPayload);
      expect(result.id).toContain('temp-');
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('updateHighlight', () => {
    it('should call API when online', async () => {
      const mockResponse = { id: highlightId, ...mockPayload };
      (cornellApi.updateHighlight as jest.Mock).mockResolvedValue(mockResponse);

      const result = await highlightsService.updateHighlight(
        contentId,
        highlightId,
        mockPayload as any,
        { isOnline: true }
      );

      expect(cornellApi.updateHighlight).toHaveBeenCalledWith(contentId, highlightId, mockPayload);
      expect(offlineQueue.add).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should add to offline queue when offline', async () => {
      await highlightsService.updateHighlight(
        contentId,
        highlightId,
        mockPayload as any,
        { isOnline: false }
      );

      expect(cornellApi.updateHighlight).not.toHaveBeenCalled();
      expect(offlineQueue.add).toHaveBeenCalledWith({
        type: 'UPDATE_HIGHLIGHT',
        contentId,
        highlightId,
        data: mockPayload,
      });
    });
  });

  describe('deleteHighlight', () => {
    it('should call API when online', async () => {
      (cornellApi.deleteHighlight as jest.Mock).mockResolvedValue({ success: true });

      await highlightsService.deleteHighlight(
        contentId,
        highlightId,
        { isOnline: true }
      );

      expect(cornellApi.deleteHighlight).toHaveBeenCalledWith(contentId, highlightId);
      expect(offlineQueue.add).not.toHaveBeenCalled();
    });

    it('should add to offline queue when offline', async () => {
      await highlightsService.deleteHighlight(
        contentId,
        highlightId,
        { isOnline: false }
      );

      expect(cornellApi.deleteHighlight).not.toHaveBeenCalled();
      expect(offlineQueue.add).toHaveBeenCalledWith({
        type: 'DELETE_HIGHLIGHT',
        contentId,
        highlightId,
      });
    });
  });

  describe('updateVisibility', () => {
    const visibilityConfig = {
      visibility: 'public',
      visibility_scope: 'global',
      context_type: 'none',
      context_id: undefined,
    };

    it('should call updateHighlightVisibility API', async () => {
      (cornellApi.updateHighlightVisibility as jest.Mock).mockResolvedValue({ success: true });

      await highlightsService.updateVisibility(
        contentId,
        highlightId,
        visibilityConfig as any
      );

      expect(cornellApi.updateHighlightVisibility).toHaveBeenCalledWith(
        contentId,
        highlightId,
        expect.objectContaining({ visibility: 'public' })
      );
    });
  });
});
