/**
 * Tests for Cornell Highlights Hooks
 * Adapted for Jest
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useGetHighlights,
  useCreateHighlight,
  useUpdateVisibility,
  useDeleteHighlight,
  useCreateComment,
} from '@/hooks/cornell/use-cornell-highlights';
import { AnnotationVisibility } from '@/lib/constants/enums';

// Mock API client
jest.mock('@/hooks/use-api-client', () => ({
  useApiClient: () => ({
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn((url: string, data: any) =>
      Promise.resolve({
        data: { id: 'new-id', ...data },
      })
    ),
    patch: jest.fn((url: string, data: any) =>
      Promise.resolve({
        data: { id: 'highlight-1', ...data },
      })
    ),
    delete: jest.fn(() => Promise.resolve()),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGetHighlights', () => {
  it('should fetch highlights for content', async () => {
    const { result } = renderHook(
      () => useGetHighlights('content-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should not fetch if contentId is empty', () => {
    const { result } = renderHook(() => useGetHighlights(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateHighlight', () => {
  it('should create highlight', async () => {
    const { result } = renderHook(
      () => useCreateHighlight('content-123'),
      { wrapper: createWrapper() }
    );

    const highlightData = {
      type: 'NOTE' as const,
      target_type: 'PDF' as any,
      page_number: 1,
      comment_text: 'Test note',
    };

    result.current.mutate(highlightData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Check match object but handle implementation details
    expect(result.current.data).toEqual(expect.objectContaining({
      id: 'new-id',
      ...highlightData
    }));
  });
});

describe('useUpdateVisibility', () => {
  it('should update visibility', async () => {
    const { result } = renderHook(
      () => useUpdateVisibility('highlight-1', 'content-123'),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      visibility: AnnotationVisibility.PUBLIC,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(expect.objectContaining({
      visibility: AnnotationVisibility.PUBLIC,
    }));
  });
});

describe('useDeleteHighlight', () => {
  it('should delete highlight', async () => {
    const { result } = renderHook(
      () => useDeleteHighlight('content-123'),
      { wrapper: createWrapper() }
    );

    result.current.mutate('highlight-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useCreateComment', () => {
  it('should create comment', async () => {
    const { result } = renderHook(
      () => useCreateComment('highlight-1', 'content-123'),
      { wrapper: createWrapper() }
    );

    result.current.mutate('New comment');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
