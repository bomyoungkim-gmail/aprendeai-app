/**
 * Games API Service
 * 
 * Pure API calls for Games functionality.
 */

import api from '@/lib/api';

// ========================================
// TYPES
// ========================================

export interface FetchQuestionsPayload {
  gameType: string;
  topic?: string;
  subject?: string;
  educationLevel?: string;
  count?: number;
  language?: string;
}

export interface SubmitResultPayload {
  questionId: string;
  score: number;
  timeTaken: number;
  isCorrect: boolean;
  mistakes?: any;
  userAnswer?: any;
}

// ========================================
// API CALLS
// ========================================

export const gamesApi = {
  /**
   * Fetch questions for a game
   */
  fetchQuestions: async (gameId: string, payload: FetchQuestionsPayload) => {
    const { data } = await api.post(`/games/${gameId}/questions`, payload);
    return data;
  },

  /**
   * Submit game result
   */
  submitResult: async (payload: SubmitResultPayload) => {
    const { data } = await api.post(
      `/games/questions/${payload.questionId}/result`,
      payload
    );
    return data;
  },

  /**
   * Fetch game progress
   */
  fetchProgress: async () => {
    const { data } = await api.get('/games/progress');
    return data;
  },

  /**
   * Fetch progress for specific game
   */
  fetchGameProgress: async (gameId: string) => {
    const { data } = await api.get(`/games/progress/${gameId}`);
    return data;
  },
};
