/**
 * useGroups Hook Tests
 * 
 * Comprehensive tests for Study Groups hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useGroups, useGroup, useCreateGroup, useInviteGroupMember, useRemoveGroupMember } from '@/hooks/social/use-groups';
import api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Setup QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useGroups Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGroups', () => {
    it('should fetch groups successfully', async () => {
      const mockGroups = [{ id: '1', name: 'Group 1' }];
      (api.get as jest.Mock).mockResolvedValue({ data: mockGroups });

      const { result } = renderHook(() => useGroups(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockGroups);
      expect(api.get).toHaveBeenCalledWith('/groups');
    });
  });

  describe('useGroup', () => {
    it('should fetch single group', async () => {
      const mockGroup = { id: '1', name: 'Group 1' };
      (api.get as jest.Mock).mockResolvedValue({ data: mockGroup });

      const { result } = renderHook(() => useGroup('1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockGroup);
      expect(api.get).toHaveBeenCalledWith('/groups/1');
    });

    it('should be disabled if no id provided', async () => {
      const { result } = renderHook(() => useGroup(''), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateGroup', () => {
    it('should create group and invalidate queries', async () => {
      const payload = { name: 'New Group', description: 'Desc' };
      (api.post as jest.Mock).mockResolvedValue({ data: { id: '1', ...payload } });

      const { result } = renderHook(() => useCreateGroup(), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.post).toHaveBeenCalledWith('/groups', payload);
    });
  });

  describe('useInviteGroupMember', () => {
    it('should invite member', async () => {
      const payload = { userId: 'u1', role: 'MEMBER' as const };
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useInviteGroupMember('g1'), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.post).toHaveBeenCalledWith('/groups/g1/members/invite', payload);
    });
  });

  describe('useRemoveGroupMember', () => {
    it('should remove member', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useRemoveGroupMember('g1'), { wrapper });

      result.current.mutate('u1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.delete).toHaveBeenCalledWith('/groups/g1/members/u1');
    });
  });
});
