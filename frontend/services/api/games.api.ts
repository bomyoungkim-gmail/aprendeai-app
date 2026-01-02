/**
 * Games API Service (CONSOLIDATED)
 * 
 * Pure API calls for Games functionality with Zod validation.
 * 
 * This file consolidates:
 * - lib/api/games.ts (types, endpoints)
 * - services/api/games.api.ts (structure, documentation)
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import {
  GameQuestionsArraySchema,
  GameResultSchema,
  GameProgressSchema,
  AllGamesProgressSchema,
  GameCatalogSchema,
  type GameQuestion,
  type GameResult,
  type SubmitResultPayload,
  type FetchQuestionsPayload,
} from '@/lib/schemas/games.schema';

// ========================================
// API CLIENT
// ========================================

export const gamesApi = {
  /**
   * Get games catalog
   * @returns List of available games
   */
  getCatalog: async () => {
    const { data } = await api.get(API_ENDPOINTS.GAMES.CATALOG);
    return GameCatalogSchema.parse(data);
  },

  /**
   * Get questions for a specific game
   * @param gameId - Game identifier
   * @param limit - Maximum number of questions (default: 10)
   * @returns Array of game questions
   */
  getQuestions: async (gameId: string, limit = 10): Promise<GameQuestion[]> => {
    const { data } = await api.get(API_ENDPOINTS.GAMES.QUESTIONS(gameId), {
      params: { limit }
    });
    return GameQuestionsArraySchema.parse(data);
  },

  /**
   * Fetch questions with advanced filters (POST)
   * @param gameId - Game identifier
   * @param payload - Filter criteria
   * @returns Array of game questions
   */
  fetchQuestions: async (gameId: string, payload: FetchQuestionsPayload) => {
    const { data } = await api.post(`/games/${gameId}/questions`, payload);
    return GameQuestionsArraySchema.parse(data);
  },

  /**
   * Submit game result
   * @param payload - Result data
   * @returns Submission confirmation
   */
  submitResult: async (payload: SubmitResultPayload) => {
    const { data } = await api.post(
      `/games/questions/${payload.questionId}/result`,
      payload
    );
    return data;
  },

  /**
   * Submit game result (alternative endpoint)
   * @param gameId - Game identifier
   * @param result - Game result data
   * @returns Submission confirmation
   */
  submitGameResult: async (gameId: string, result: GameResult) => {
    const { data } = await api.post(API_ENDPOINTS.GAMES.SUBMIT(gameId), result);
    return data;
  },

  /**
   * Get overall games progress
   * @returns Progress for all games
   */
  fetchProgress: async () => {
    const { data } = await api.get('/games/progress');
    return AllGamesProgressSchema.parse(data);
  },

  /**
   * Get progress for a specific game
   * @param gameId - Game identifier
   * @returns Progress for the specified game
   */
  fetchGameProgress: async (gameId: string) => {
    const { data } = await api.get(`/games/progress/${gameId}`);
    return GameProgressSchema.parse(data);
  },

  /**
   * Get progress for a specific game (alias)
   * @param gameId - Game identifier
   * @returns Progress for the specified game
   */
  getProgress: async (gameId: string) => {
    const { data } = await api.get(API_ENDPOINTS.GAMES.GAME_PROGRESS(gameId));
    return GameProgressSchema.parse(data);
  },
};

// ========================================
// TYPE RE-EXPORTS (for backward compatibility)
// ========================================

export type {
  GameQuestion,
  GameResult,
  SubmitResultPayload,
  FetchQuestionsPayload,
} from '@/lib/schemas/games.schema';
