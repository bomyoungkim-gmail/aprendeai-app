
import { api } from '@/lib/api';

export const gamesApi = {
  getQuestions: async (gameId: string) => {
    const response = await api.get(`/games/${gameId}/questions`);
    return response.data;
  },
  submitResult: async (gameId: string, result: any) => {
    const response = await api.post(`/games/${gameId}/submit`, result);
    return response.data;
  }
};
