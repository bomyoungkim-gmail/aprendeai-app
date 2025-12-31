import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';

export function useReadingSession(sessionId: string) {
  return useQuery({
    queryKey: ['readingSession', sessionId],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.SESSIONS.GET(sessionId));
      return data;
    },
    enabled: !!sessionId,
    staleTime: 30000, // Cache por 30s
  });
}

export function useFinishSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto?: { reason?: string }) => {
      const { data } = await api.post(API_ENDPOINTS.SESSIONS.FINISH(sessionId), dto || { reason: 'user_turn_in' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingSession', sessionId] });
    },
  });
}
