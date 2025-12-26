import { renderHook, waitFor } from '@testing-library/react';
import { useGameProgress, useGameProgressById } from '@/hooks/games';

global.fetch = jest.fn();

describe('useGameProgress', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('fetches progress on mount', async () => {
    const mockProgress = {
      totalGamesPlayed: 5,
      totalStars: 12,
      favoriteGame: 'CONCEPT_LINKING',
      currentStreak: 3,
      gamesProgress: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProgress,
    });

    const { result } = renderHook(() => useGameProgress());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.progress).toEqual(mockProgress);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGameProgress());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('refetches when called', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ totalStars: 12 }),
    });

    const { result } = renderHook(() => useGameProgress());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('useGameProgressById', () => {
  it('fetches specific game progress', async () => {
    const mockProgress = {
      gameId: 'CONCEPT_LINKING',
      stars: 3,
      bestScore: 95,
      totalPlays: 10,
      streak: 5,
      lastPlayed: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProgress,
    });

    const { result } = renderHook(() => useGameProgressById('CONCEPT_LINKING'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.progress).toEqual(mockProgress);
  });
});
