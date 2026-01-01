/**
 * Content Domain Service Tests
 * 
 * Comprehensive tests for content service business logic
 */

import { contentService } from '@/services/content/content.service';
import { contentApi } from '@/services/api/content.api';
import { ContentType } from '@/lib/constants/enums';

// Mock contentApi
jest.mock('@/services/api/content.api', () => ({
  contentApi: {
    getMyContents: jest.fn(),
    getContent: jest.fn(),
    createContent: jest.fn(),
    updateContent: jest.fn(),
    deleteContent: jest.fn(),
  },
}));

describe('ContentService', () => {
  const mockContents = [
    { id: '1', title: 'Content 1', type: ContentType.VIDEO },
    { id: '2', title: 'Content 2', type: ContentType.PDF },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('should fetch all contents successfully', async () => {
      (contentApi.getMyContents as jest.Mock).mockResolvedValue(mockContents);

      const result = await contentService.fetchAll();

      expect(contentApi.getMyContents).toHaveBeenCalled();
      expect(result).toEqual(mockContents);
    });

    it('should throw error when fetch fails', async () => {
      const error = new Error('Network error');
      (contentApi.getMyContents as jest.Mock).mockRejectedValue(error);

      await expect(contentService.fetchAll()).rejects.toThrow('Network error');
    });
  });

  describe('fetchById', () => {
    it('should fetch content by id successfully', async () => {
      const mockContent = mockContents[0];
      (contentApi.getContent as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentService.fetchById('1');

      expect(contentApi.getContent).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockContent);
    });

    it('should throw error if id is missing', async () => {
      await expect(contentService.fetchById('')).rejects.toThrow('Content ID is required');
      expect(contentApi.getContent).not.toHaveBeenCalled();
    });

    it('should throw error when fetch fails', async () => {
      (contentApi.getContent as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(contentService.fetchById('999')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    const validPayload = { title: 'New Content', type: ContentType.PDF, content: 'test', originalFileName: 'test.pdf' };

    it('should create content successfully', async () => {
      const mockCreated = { id: '3', ...validPayload };
      (contentApi.createContent as jest.Mock).mockResolvedValue(mockCreated);

      const result = await contentService.create(validPayload);

      expect(contentApi.createContent).toHaveBeenCalledWith(validPayload);
      expect(result).toEqual(mockCreated);
    });

    it('should throw error if title is empty', async () => {
      await expect(contentService.create({ ...validPayload, title: '  ' })).rejects.toThrow('Title is required');
      expect(contentApi.createContent).not.toHaveBeenCalled();
    });

    it('should throw error when create fails', async () => {
      (contentApi.createContent as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(contentService.create(validPayload)).rejects.toThrow('API Error');
    });
  });

  describe('update', () => {
    const updatePayload = { title: 'Updated Title' };

    it('should update content successfully', async () => {
      const mockUpdated = { id: '1', title: 'Updated Title', type: ContentType.VIDEO };
      (contentApi.updateContent as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await contentService.update('1', updatePayload);

      expect(contentApi.updateContent).toHaveBeenCalledWith('1', updatePayload);
      expect(result).toEqual(mockUpdated);
    });

    it('should throw error if id is missing', async () => {
      await expect(contentService.update('', updatePayload)).rejects.toThrow('Content ID is required');
      expect(contentApi.updateContent).not.toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      (contentApi.updateContent as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(contentService.update('1', updatePayload)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete content successfully', async () => {
      (contentApi.deleteContent as jest.Mock).mockResolvedValue(undefined);

      await contentService.delete('1');

      expect(contentApi.deleteContent).toHaveBeenCalledWith('1');
    });

    it('should throw error if id is missing', async () => {
      await expect(contentService.delete('')).rejects.toThrow('Content ID is required');
      expect(contentApi.deleteContent).not.toHaveBeenCalled();
    });

    it('should throw error when delete fails', async () => {
      (contentApi.deleteContent as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(contentService.delete('1')).rejects.toThrow('Delete failed');
    });
  });
});
