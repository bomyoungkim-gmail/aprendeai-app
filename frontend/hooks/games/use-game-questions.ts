/**
 * Game Questions Hook
 * 
 * React Query hooks for fetching and submitting game questions.
 * Uses questionsService for business logic separation.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { questionsService, type GameQuestion } from '@/services';

interface UseGameQuestionsParams {
  gameId: string;
  topic?: string;
  subject?: string;
  educationLevel?: string;
  count?: number;
  language?: string;
  enabled?: boolean;
}

/**
 * Fetch questions for a specific game
 */
export function useGameQuestions({
  gameId,
  topic = 'General',
  subject = 'General',
  educationLevel = 'medio',
  count = 5,
  language = 'pt-BR',
  enabled = true
}: UseGameQuestionsParams) {
  return useQuery({
    queryKey: ['game-questions', gameId, topic, subject, educationLevel, language],
    queryFn: () => questionsService.fetchQuestions(gameId, {
      topic,
      subject,
      educationLevel,
      count,
      language,
    }),
    enabled: enabled && !!gameId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Submit game result/answer
 */
export function useSubmitGameResult() {
  return useMutation({
    mutationFn: (data: { 
      questionId: string; 
      score: number; 
      timeTaken: number; 
      isCorrect: boolean;
      mistakes?: any;
      userAnswer?: any;
    }) => questionsService.submitResult(data),
  });
}

