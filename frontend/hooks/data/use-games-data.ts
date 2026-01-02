/**
 * Games Data Hooks
 * 
 * React Query hooks for accessing Games API data.
 * Pure data fetching - no business logic.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/services/api/games.api';
import type { GameResult } from '@/lib/schemas/games.schema';

// ========================================
// QUERIES (GET)
// ========================================

/**
 * Get games catalog
 */
export function useGameCatalog() {
  return useQuery({
    queryKey: ['games', 'catalog'],
    queryFn: () => gamesApi.getCatalog(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get questions for a specific game
 */
export function useGameQuestions(gameId: string, limit = 10) {
  return useQuery({
    queryKey: ['games', gameId, 'questions', limit],
    queryFn: () => gamesApi.getQuestions(gameId, limit),
    enabled: !!gameId,
  });
}

/**
 * Get overall games progress
 */
export function useGamesProgress() {
  return useQuery({
    queryKey: ['games', 'progress'],
    queryFn: () => gamesApi.fetchProgress(),
  });
}

/**
 * Get progress for a specific game
 */
export function useGameProgress(gameId: string) {
  return useQuery({
    queryKey: ['games', gameId, 'progress'],
    queryFn: () => gamesApi.fetchGameProgress(gameId),
    enabled: !!gameId,
  });
}

// ========================================
// MUTATIONS (POST/PUT/DELETE)
// ========================================

/**
 * Submit game result
 * 
 * NOTE: This is a low-level mutation.
 * For business logic, use hooks/domain/use-submit-game-result.ts instead.
 */
export function useSubmitGameResultMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, result }: { gameId: string; result: GameResult }) =>
      gamesApi.submitGameResult(gameId, result),
    onSuccess: (_, { gameId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['games', gameId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['games', 'progress'] });
    },
  });
}
