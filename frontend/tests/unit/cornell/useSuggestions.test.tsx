import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSuggestions } from '@/hooks/cornell/useSuggestions';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

describe('useSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should fetch suggestions on mount', async () => {
    const mockSuggestions = [
      {
        id: 'sug-1',
        type: 'vocabulary_triage' as const,
        icon: '💡' as const,
        title: 'Test Suggestion',
        description: 'Test description',
        actionLabel: 'Action',
      },
    ];

    vi.mocked(api.get).mockResolvedValue({ 
      data: { suggestions: mockSuggestions } 
    });

    const { result } = renderHook(() => useSuggestions('content-1'));

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });
  });

  it('should poll for suggestions every 30 seconds', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { suggestions: [] } });

    renderHook(() => useSuggestions('content-1'));

    // Initial call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    // Fast-forward another 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(3);
    });
  });

  it('should accept suggestion and remove from list', async () => {
    const mockSuggestions = [
      { id: 'sug-1', type: 'vocabulary_triage' as const, icon: '💡' as const, title: 'Test', description: 'Desc', actionLabel: 'Action' },
    ];

    vi.mocked(api.get).mockResolvedValue({ data: { suggestions: mockSuggestions } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useSuggestions('content-1'));

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.acceptSuggestion('sug-1');
    });

    expect(api.post).toHaveBeenCalledWith('/cornell/suggestions/sug-1/accept');
    expect(result.current.suggestions).toHaveLength(0);
  });

  it('should dismiss suggestion and remove from list', async () => {
    const mockSuggestions = [
      { id: 'sug-1', type: 'checkpoint_quiz' as const, icon: '🎯' as const, title: 'Quiz', description: 'Take quiz', actionLabel: 'Start' },
    ];

    vi.mocked(api.get).mockResolvedValue({ data: { suggestions: mockSuggestions } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useSuggestions('content-1'));

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.dismissSuggestion('sug-1');
    });

    expect(api.post).toHaveBeenCalledWith('/cornell/suggestions/sug-1/dismiss');
    expect(result.current.suggestions).toHaveLength(0);
  });

  it('should indicate when there are unseen suggestions', async () => {
    vi.mocked(api.get).mockResolvedValue({ 
      data: { suggestions: [{ id: 'sug-1', type: 'mini_game' as const, icon: '🎮' as const, title: 'Game', description: 'Play', actionLabel: 'Play' }] } 
    });

    const { result } = renderHook(() => useSuggestions('content-1'));

    await waitFor(() => {
      expect(result.current.hasUnseenSuggestions).toBe(true);
    });
  });

  it('should emit custom event when suggestion is accepted', async () => {
    const mockSuggestion = { 
      id: 'sug-1', 
      type: 'vocabulary_triage' as const, 
      icon: '💡' as const, 
      title: 'Triage', 
      description: 'View words', 
      actionLabel: 'View' 
    };

    vi.mocked(api.get).mockResolvedValue({ data: { suggestions: [mockSuggestion] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    const eventListener = vi.fn();
    window.addEventListener('suggestion-accepted', eventListener);

    const { result } = renderHook(() => useSuggestions('content-1'));

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.acceptSuggestion('sug-1');
    });

    expect(eventListener).toHaveBeenCalled();
    
    window.removeEventListener('suggestion-accepted', eventListener);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useSuggestions('content-1'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch suggestions:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
