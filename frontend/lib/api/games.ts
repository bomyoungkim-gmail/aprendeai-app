import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';

export interface GameQuestion {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED' | 'FLASHCARD';
  options?: string[]; // For Multiple Choice
  correctAnswer?: string; // For validation if needed on frontend (sometimes hidden)
  explanation?: string;
  difficulty: number;
}

export interface GameResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  details?: any; // JSON for specific game data
}

export const gamesApi = {
  // Catalog & Progress
  getCatalog: async () => {
    const { data } = await api.get(API_ENDPOINTS.GAMES.CATALOG);
    return data;
  },

  getProgress: async (gameId: string) => {
    const { data } = await api.get(API_ENDPOINTS.GAMES.GAME_PROGRESS(gameId));
    return data;
  },

  // Question Bank Integration
  getQuestions: async (gameId: string, limit = 10): Promise<GameQuestion[]> => {
    const { data } = await api.get(API_ENDPOINTS.GAMES.QUESTIONS(gameId), {
      params: { limit }
    });
    return data;
  },

  // Result Submission
  submitResult: async (gameId: string, result: GameResult) => {
    const { data } = await api.post(API_ENDPOINTS.GAMES.SUBMIT(gameId), result);
    return data;
  }
};
