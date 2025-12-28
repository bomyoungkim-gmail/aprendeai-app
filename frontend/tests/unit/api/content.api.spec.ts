/**
 * Content API Tests
 * 
 * Comprehensive tests for Content API
 */

import { contentApi } from '@/services/api/content.api';
import api from '@/lib/api';

// Mock API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(), // update uses patch
    delete: jest.fn(),
  },
}));

describe('ContentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyContents', () => {
    it('should fetch contents', async () => {
      const mockContents = [{ id: '1', title: 'Content 1' }];
      (api.get as jest.Mock).mockResolvedValue({ data: mockContents });

      const result = await contentApi.getMyContents();

      expect(api.get).toHaveBeenCalledWith('/contents/my-contents');
      expect(result).toEqual(mockContents);
    });
  });

  describe('getContent', () => {
    it('should fetch content details', async () => {
      const mockContent = { id: '1', title: 'Content 1' };
      (api.get as jest.Mock).mockResolvedValue({ data: mockContent });

      const result = await contentApi.getContent('1');

      expect(api.get).toHaveBeenCalledWith('/contents/1');
      expect(result).toEqual(mockContent);
    });
  });

  describe('createContent', () => {
    it('should create content', async () => {
      const payload = { title: 'New Content', type: 'PDF' as const };
      const mockResponse = { id: '2', ...payload };
      (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await contentApi.createContent(payload);

      expect(api.post).toHaveBeenCalledWith('/contents', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateContent', () => {
    it('should update content', async () => {
      const payload = { title: 'Updated' };
      const mockResponse = { id: '1', ...payload };
      (api.patch as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await contentApi.updateContent('1', payload);

      expect(api.patch).toHaveBeenCalledWith('/contents/1', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteContent', () => {
    it('should delete content', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      await contentApi.deleteContent('1');

      expect(api.delete).toHaveBeenCalledWith('/contents/1');
    });
  });
});
