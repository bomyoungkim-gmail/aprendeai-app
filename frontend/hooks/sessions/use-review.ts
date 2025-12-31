import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ReviewQueueItem, VocabAttemptDto } from '@/lib/types/review';

export function useReviewQueue(limit?: number) {
  return useQuery({
    queryKey: ['review', 'queue', limit],
    queryFn: async () => {
      const { data } = await api.get<ReviewQueueItem[]>('/review/queue', { 
        params: { limit } 
      });
      return data;
    },
  });
}

export function useRecordAttempt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: VocabAttemptDto) => {
      const { data } = await api.post('/review/vocab/attempt', dto);
      return data;
    },
    onSuccess: () => {
      // Invalidate both queue and stats if they exist
      queryClient.invalidateQueries({ queryKey: ['review'] });
    },
  });
}
