/**
 * Groups API Tests
 * 
 * Comprehensive tests for Groups API integration
 * Matches actual implementation in groups.api.ts
 */

import { groupsApi } from '@/services/api/groups.api';
// Mock API client
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '@/lib/api';

describe('GroupsApi', () => {
  const mockGroups = [{ id: '1', name: 'Group 1' }, { id: '2', name: 'Group 2' }];
  const mockGroup = { id: '1', name: 'Group 1', members: [] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGroups', () => {
    it('should fetch groups successfully', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockGroups });

      const result = await groupsApi.getGroups();

      expect(api.get).toHaveBeenCalledWith('/study-groups');
      expect(result).toEqual(mockGroups);
    });

    it('should handle errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
      await expect(groupsApi.getGroups()).rejects.toThrow('API Error');
    });
  });

  describe('getGroup', () => {
    it('should fetch group details successfully', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockGroup });

      const result = await groupsApi.getGroup('1');

      expect(api.get).toHaveBeenCalledWith('/study-groups/1');
      expect(result).toEqual(mockGroup);
    });
  });

  describe('createGroup', () => {
    it('should create group successfully', async () => {
      const payload = { name: 'New Group', description: 'Test' };
      (api.post as jest.Mock).mockResolvedValue({ data: { id: '3', ...payload } });

      const result = await groupsApi.createGroup(payload);

      expect(api.post).toHaveBeenCalledWith('/study-groups', payload);
      expect(result).toEqual({ id: '3', ...payload });
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      await groupsApi.deleteGroup('1');

      expect(api.delete).toHaveBeenCalledWith('/study-groups/1');
    });
  });

  describe('inviteMember', () => {
    it('should invite member successfully', async () => {
      const payload = { userId: 'user-123', role: 'MEMBER' as const };
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await groupsApi.inviteMember('1', payload);

      expect(api.post).toHaveBeenCalledWith('/study-groups/1/members/invite', payload);
      expect(result).toEqual({ success: true });
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      await groupsApi.removeMember('1', 'user-123');

      expect(api.delete).toHaveBeenCalledWith('/study-groups/1/members/user-123');
    });
  });
});
