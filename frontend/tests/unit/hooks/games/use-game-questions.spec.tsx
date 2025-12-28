import { renderHook, waitFor } from '@testing-library/react';
import { useGameQuestions, useSubmitGameResult } from '@/hooks/games/use-game-questions';
import { questionsService } from '@/services/games/questions.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock service
jest.mock('@/services/games/questions.service', () => ({
  questionsService: {
    fetchQuestions: jest.fn(),
    submitResult: jest.fn(),
  },
}));

describe('useGameQuestions Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useGameQuestions', () => {
    it('should fetch questions', async () => {
      const mockQuestions = [{ id: 'q1', text: 'Q1' }];
      (questionsService.fetchQuestions as jest.Mock).mockResolvedValue(mockQuestions);

      const { result } = renderHook(() => useGameQuestions({ gameId: 'quiz' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockQuestions);
      expect(questionsService.fetchQuestions).toHaveBeenCalledWith('quiz', expect.any(Object));
    });

    it('should respect enabled flag', () => {
      const { result } = renderHook(() => useGameQuestions({ gameId: 'quiz', enabled: false }), { wrapper });
      expect(result.current.isPending).toBe(true);
      expect(questionsService.fetchQuestions).not.toHaveBeenCalled();
    });
  });

  describe('useSubmitGameResult', () => {
    it('should submit result', async () => {
      const mockResult = { success: true };
      (questionsService.submitResult as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useSubmitGameResult(), { wrapper });

      await result.current.mutateAsync({
        questionId: 'q1',
        score: 100,
        timeTaken: 10,
        isCorrect: true,
      });

      expect(questionsService.submitResult).toHaveBeenCalledWith({
        questionId: 'q1',
        score: 100,
        timeTaken: 10,
        isCorrect: true,
      });
    });
  });
});
