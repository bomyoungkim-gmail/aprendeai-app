import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { GameQuestion } from '@/components/games/types'; // We'll need to define this or import from a shared location

interface UseGameQuestionsParams {
  gameId: string;
  topic?: string;
  subject?: string;
  educationLevel?: string;
  count?: number;
  language?: string;
  enabled?: boolean;
}

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
    queryFn: async () => {
      const { data } = await api.post(`/games/${gameId}/questions`, {
        gameType: gameId,
        topic,
        subject,
        educationLevel,
        count,
        language
      });
      return data as GameQuestion[];
    },
    enabled: enabled && !!gameId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function useSubmitGameResult() {
  return useMutation({
    mutationFn: async (data: { 
      questionId: string; 
      score: number; 
      timeTaken: number; 
      isCorrect: boolean;
      mistakes?: any;
      userAnswer?: any;
    }) => {
      const { data: result } = await api.post(`/games/questions/${data.questionId}/result`, data);
      return result;
    },
  });
}
