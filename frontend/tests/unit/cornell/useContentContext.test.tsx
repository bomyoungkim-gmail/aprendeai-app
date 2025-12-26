import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentContext } from '@/hooks/cornell/useContentContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

describe('useContentContext', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch pedagogical data and suggestions', async () => {
    const mockData = {
      pedagogicalData: {
        id: 'ped-1',
        contentId: 'content-1',
        vocabularyTriage: {
          words: [{ word: 'Fotossíntese', definition: 'Processo de conversão de luz em energia' }],
        },
      },
      suggestions: [
        {
          id: 'sug-1',
          type: 'vocabulary_triage' as const,
          icon: '💡' as const,
          title: 'Triagem de Vocabulário',
          description: 'Este texto tem termos técnicos complexos.',
          actionLabel: 'Ver Triagem',
        },
      ],
    };

    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useContentContext('content-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pedagogicalData).toEqual(mockData.pedagogicalData);
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].title).toBe('Triagem de Vocabulário');
  });

  it('should return null pedagogicalData when not available', async () => {
    vi.mocked(api.get).mockResolvedValue({ 
      data: { pedagogicalData: null, suggestions: [] } 
    });

    const { result } = renderHook(() => useContentContext('content-2'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pedagogicalData).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useContentContext('content-3'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should NOT make request if contentId is empty', () => {
    renderHook(() => useContentContext(''), { wrapper });

    expect(api.get).not.toHaveBeenCalled();
  });

  it('should use correct API endpoint with contentId', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { pedagogicalData: null, suggestions: [] } });

    renderHook(() => useContentContext('test-content-id'), { wrapper });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/cornell/contents/test-content-id/context');
    });
  });
});
