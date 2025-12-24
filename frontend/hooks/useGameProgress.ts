import { useState, useEffect, useCallback } from 'react';

interface GameProgress {
  gameId: string;
  stars: number;
  bestScore: number;
  totalPlays: number;
  streak: number;
  lastPlayed: Date | null;
}

interface ProgressSummary {
  totalGamesPlayed: number;
  totalStars: number;
  favoriteGame: string | null;
  currentStreak: number;
  gamesProgress: GameProgress[];
}

/**
 * Hook to fetch and manage game progress
 * Reusable across components
 */
export function useGameProgress(userId?: string) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/games/progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch game progress');
      }
      
      const data = await response.json();
      setProgress(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const refetch = useCallback(() => {
    return fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for specific game progress
 */
export function useGameProgressById(gameId: string) {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/games/progress/${gameId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setProgress(data);
        setLoading(false);
      })
      .catch(() => {
        setProgress(null);
        setLoading(false);
      });
  }, [gameId]);

  return { progress, loading };
}
