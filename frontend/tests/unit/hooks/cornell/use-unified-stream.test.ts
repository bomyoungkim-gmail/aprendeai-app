import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUnifiedStream } from '@/hooks/cornell/use-unified-stream';
import { useHighlights, useCornellNotes } from '@/hooks/cornell/use-data';
import React from 'react';

// Mock the Cornell data hooks
jest.mock('@/hooks/cornell/use-data', () => ({
  useHighlights: jest.fn(),
  useCornellNotes: jest.fn(),
}));

describe('useUnifiedStream', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should combine highlights and notes into unified stream', async () => {
    const mockHighlights = [
      {
        id: 'h1',
        contentId: 'content-1',
        userId: 'user-1',
        kind: 'TEXT' as const,
        targetType: 'PDF' as const,
        pageNumber: 1,
        anchorJson: {
          type: 'PDF_TEXT' as const,
          position: { 
            boundingRect: { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 }, 
            rects: [], 
            pageNumber: 1 
          },
          quote: 'Test highlight',
        },
        colorKey: 'yellow',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        tagsJson: [],
      },
    ];

    const mockCornellNotes = {
      id: 'cornell-1',
      contentId: 'content-1',
      userId: 'user-1',
      cuesJson: [],
      notesJson: [
        {
          id: 'n1',
          body: 'Test note',
          linkedHighlightIds: [],
        },
      ],
      summaryText: '',
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-01T09:00:00Z',
    };

    (useHighlights as jest.Mock).mockReturnValue({
      data: mockHighlights,
      isLoading: false,
    });

    (useCornellNotes as jest.Mock).mockReturnValue({
      data: mockCornellNotes,
      isLoading: false,
    });

    const { result } = renderHook(() => useUnifiedStream('content-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.streamItems).toHaveLength(2);
    });

    // Check that items are sorted by date (newest first)
    expect(result.current.streamItems[0].type).toBe('annotation');
    expect(result.current.streamItems[1].type).toBe('note');
  });

  it('should handle loading state', () => {
    (useHighlights as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    (useCornellNotes as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useUnifiedStream('content-1'), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.streamItems).toEqual([]);
  });

  it('should handle empty data', () => {
    (useHighlights as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (useCornellNotes as jest.Mock).mockReturnValue({
      data: {
        cuesJson: [],
        notesJson: [],
        summaryText: '',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useUnifiedStream('content-1'), { wrapper });

    expect(result.current.streamItems).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
