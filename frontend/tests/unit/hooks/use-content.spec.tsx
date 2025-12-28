/**
 * use-content Hook Tests
 * 
 * Comprehensive tests for content management hooks
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContents, useContent, useCreateContent, useUpdateContent, useDeleteContent } from '@/hooks/use-content';
import * as services from '@/services';

// Mock contentService
jest.mock('@/services/content/content.service', () => ({
  contentService: {
    fetchAll: jest.fn(),
    fetchById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useContents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all contents successfully', async () => {
    const mockContents = [
      { id: '1', title: 'Content 1', type: 'PDF' },
      { id: '2', title: 'Content 2', type: 'VIDEO' },
    ];

    (services.contentService.fetchAll as jest.Mock).mockResolvedValue(mockContents);

    const { result } = renderHook(() => useContents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockContents);
    expect(services.contentService.fetchAll).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    (services.contentService.fetchAll as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useContents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch single content by ID', async () => {
    const mockContent = { id: '1', title: 'Content 1', type: 'PDF' };

    (services.contentService.fetchById as jest.Mock).mockResolvedValue(mockContent);

    const { result } = renderHook(() => useContent('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockContent);
    expect(services.contentService.fetchById).toHaveBeenCalledWith('1');
  });

  it('should not fetch when ID is empty', () => {
    const { result } = renderHook(() => useContent(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(services.contentService.fetchById).not.toHaveBeenCalled();
  });
});

describe('useCreateContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create content successfully', async () => {
    const newContent = { id: '3', title: 'New Content', type: 'ARTICLE' };
    const payload = { title: 'New Content', type: 'ARTICLE' as const };

    (services.contentService.create as jest.Mock).mockResolvedValue(newContent);

    const { result } = renderHook(() => useCreateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(services.contentService.create).toHaveBeenCalledWith(payload);
    expect(result.current.data).toEqual(newContent);
  });

  it('should handle creation error', async () => {
    const payload = { title: '', type: 'PDF' as const };

    (services.contentService.create as jest.Mock).mockRejectedValue(new Error('Title is required'));

    const { result } = renderHook(() => useCreateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useUpdateContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update content successfully', async () => {
    const updatedContent = { id: '1', title: 'Updated Title' };
    const payload = { title: 'Updated Title' };

    (services.contentService.update as jest.Mock).mockResolvedValue(updatedContent);

    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(services.contentService.update).toHaveBeenCalledWith('1', payload);
  });
});

describe('useDeleteContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete content successfully', async () => {
    (services.contentService.delete as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(services.contentService.delete).toHaveBeenCalledWith('1');
  });

  it('should handle deletion error', async () => {
    (services.contentService.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
