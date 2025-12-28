import { gamesApi } from '@/services/api/games.api';
import api from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Games API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchQuestions', () => {
    it('should fetch questions with correct payload', async () => {
      const mockResponse = { data: [{ id: 'q1', type: 'multiple-choice' }] };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const payload = {
        gameType: 'quiz',
        topic: 'Math',
        count: 10,
      };

      const result = await gamesApi.fetchQuestions('quiz', payload);

      expect(api.post).toHaveBeenCalledWith('/games/quiz/questions', payload);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors', async () => {
      const error = new Error('Network error');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(gamesApi.fetchQuestions('quiz', { gameType: 'quiz' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('submitResult', () => {
    it('should submit result to correct endpoint', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const payload = {
        questionId: 'q1',
        score: 100,
        timeTaken: 10,
        isCorrect: true,
      };

      const result = await gamesApi.submitResult(payload);

      expect(api.post).toHaveBeenCalledWith(
        '/games/questions/q1/result',
        payload
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchProgress', () => {
    it('should fetch overall progress', async () => {
      const mockResponse = { data: { level: 5, xp: 1000 } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await gamesApi.fetchProgress();

      expect(api.get).toHaveBeenCalledWith('/games/progress');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchGameProgress', () => {
    it('should fetch specific game progress', async () => {
      const mockResponse = { data: { highScore: 500 } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await gamesApi.fetchGameProgress('quiz');

      expect(api.get).toHaveBeenCalledWith('/games/progress/quiz');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
