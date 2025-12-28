import { questionsService } from '@/services/games/questions.service';
import { gamesApi } from '@/services/api/games.api';

// Mock the API layer
jest.mock('@/services/api/games.api', () => ({
  gamesApi: {
    fetchQuestions: jest.fn(),
    submitResult: jest.fn(),
  },
}));

describe('Questions Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchQuestions', () => {
    it('should call api with correct defaults', async () => {
      const mockResult = [{ id: 'q1', question: 'Test' }];
      (gamesApi.fetchQuestions as jest.Mock).mockResolvedValue(mockResult);

      const result = await questionsService.fetchQuestions('quiz', {});

      expect(gamesApi.fetchQuestions).toHaveBeenCalledWith('quiz', {
        gameType: 'quiz',
        topic: 'General',
        subject: 'General',
        educationLevel: 'medio',
        count: 5,
        language: 'pt-BR',
      });
      expect(result).toEqual(mockResult);
    });

    it('should use provided options', async () => {
      (gamesApi.fetchQuestions as jest.Mock).mockResolvedValue([]);

      await questionsService.fetchQuestions('quiz', {
        topic: 'Math',
        count: 10,
        language: 'en-US',
      });

      expect(gamesApi.fetchQuestions).toHaveBeenCalledWith('quiz', expect.objectContaining({
        topic: 'Math',
        count: 10,
        language: 'en-US',
      }));
    });
  });

  describe('submitResult', () => {
    it('should submit valid result', async () => {
      const mockResult = { success: true };
      (gamesApi.submitResult as jest.Mock).mockResolvedValue(mockResult);

      const payload = {
        questionId: 'q1',
        score: 100,
        timeTaken: 10,
        isCorrect: true,
      };

      const result = await questionsService.submitResult(payload);

      expect(gamesApi.submitResult).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid score', async () => {
      const payload = {
        questionId: 'q1',
        score: 150, // Invalid
        timeTaken: 10,
        isCorrect: true,
      };

      await expect(questionsService.submitResult(payload))
        .rejects.toThrow('Score must be between 0 and 100');

      expect(gamesApi.submitResult).not.toHaveBeenCalled();
    });
  });
});
