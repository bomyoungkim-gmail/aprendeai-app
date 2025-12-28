/**
 * Questions Service
 * 
 * Business logic for game questions.
 */

import { gamesApi, type FetchQuestionsPayload } from '../api/games.api';

// ========================================
// TYPES
// ========================================

export interface GameQuestion {
  id: string;
  gameId: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  difficulty?: string;
  topic?: string;
}

// ========================================
// BUSINESS LOGIC
// ========================================

export const questionsService = {
  /**
   * Fetch questions with validation
   */
  async fetchQuestions(
    gameId: string,
    options: {
      topic?: string;
      subject?: string;
      educationLevel?: string;
      count?: number;
      language?: string;
    }
  ): Promise<GameQuestion[]> {
    // Build valid payload
    const payload: FetchQuestionsPayload = {
      gameType: gameId,
      topic: options.topic || 'General',
      subject: options.subject || 'General',
      educationLevel: options.educationLevel || 'medio',
      count: options.count || 5,
      language: options.language || 'pt-BR',
    };

    const result = await gamesApi.fetchQuestions(gameId, payload);
    
    // Transform/validate response if needed
    return result as GameQuestion[];
  },

  /**
   * Submit result with validation
   */
  async submitResult(data: {
    questionId: string;
    score: number;
    timeTaken: number;
    isCorrect: boolean;
    mistakes?: any;
    userAnswer?: any;
  }) {
    // Validation could go here
    if (data.score < 0 || data.score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    const result = await gamesApi.submitResult(data);
    return result;
  },
};
