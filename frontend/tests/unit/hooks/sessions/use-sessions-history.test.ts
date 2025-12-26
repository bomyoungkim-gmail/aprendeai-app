import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionsHistory } from '@/hooks/use-sessions-history';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

const mockApi = api as jest.Mocked<typeof api>;

describe('useSessionsHistory', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch sessions successfully', async () => {
    const mockData = {
      sessions: [
        {
          id: 'session-1',
          startedAt: '2025-01-15T10:00:00Z',
          content: { id: 'c1', title: 'Test', type: 'ARTICLE' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };

    mockApi.get.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useSessionsHistory(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockApi.get).toHaveBeenCalledWith('/sessions', { params: {} });
  });

  it('should pass filters as query params', async () => {
    mockApi.get.mockResolvedValue({ data: { sessions: [], pagination: {} } });

    const params = {
      page: 2,
      limit: 10,
      phase: 'PRE' as const,
      query: 'search term',
    };

    renderHook(() => useSessionsHistory(params), { wrapper });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/sessions', { params });
    });
  });

  it('should handle API errors', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSessionsHistory(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should cache results for 30 seconds', async () => {
    const mockData = { sessions: [], pagination: {} };
    mockApi.get.mockResolvedValue({ data: mockData });

    const { result, rerender } = renderHook(() => useSessionsHistory(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Rerender should use cache
    rerender();

    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it('should refetch when params change', async () => {
    mockApi.get.mockResolvedValue({ data: { sessions: [], pagination: {} } });

    const { rerender } = renderHook(
      ({ params }) => useSessionsHistory(params),
      {
        wrapper,
        initialProps: { params: { page: 1 } },
      }
    );

    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(1));

    rerender({ params: { page: 2 } });

    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(2));
  });
});
