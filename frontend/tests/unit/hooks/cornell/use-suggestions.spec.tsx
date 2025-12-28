import { renderHook, act } from '@testing-library/react';
import { useSuggestions } from '@/hooks/cornell/use-suggestions';
import { api } from '@/lib/api';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('useSuggestions', () => {
  const contentId = 'content-1';
  const mockSuggestions = [
    { id: 's1', content: 'Suggestion 1' },
    { id: 's2', content: 'Suggestion 2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch suggestions on mount', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { suggestions: mockSuggestions } });

    const { result } = renderHook(() => useSuggestions(contentId));
    
    // Initial state
    expect(result.current.suggestions).toEqual([]);

    // Wait for effect
    await act(async () => {
      await Promise.resolve(); // Flush microtasks
    });

    expect(api.get).toHaveBeenCalledWith(`/cornell/contents/${contentId}/context`);
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.hasUnseenSuggestions).toBe(true);
  });

  it('should accept suggestion', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { suggestions: mockSuggestions } });
    const { result } = renderHook(() => useSuggestions(contentId));
    
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.acceptSuggestion('s1');
    });

    expect(api.post).toHaveBeenCalledWith('/cornell/suggestions/s1/accept');
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].id).toBe('s2');
  });

  it('should dismiss suggestion', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { suggestions: mockSuggestions } });
    const { result } = renderHook(() => useSuggestions(contentId));
    
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.dismissSuggestion('s1');
    });

    expect(api.post).toHaveBeenCalledWith('/cornell/suggestions/s1/dismiss');
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].id).toBe('s2');
  });

  it('should poll for suggestions', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { suggestions: [] } });
    const { result } = renderHook(() => useSuggestions(contentId));

    await act(async () => {
      await Promise.resolve();
    });

    // Mock next poll response
    const newSuggestions = [{ id: 's3', content: 'New' }];
    (api.get as jest.Mock).mockResolvedValue({ data: { suggestions: newSuggestions } });

    // Fast forward time
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(result.current.suggestions).toEqual(newSuggestions);
  });
});
