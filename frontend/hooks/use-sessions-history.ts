import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SessionsParams {
  page?: number;
  limit?: number;
  since?: string;
  until?: string;
  phase?: 'PRE' | 'DURING' | 'POST';
  query?: string;
  sortBy?: 'startedAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export function useSessionsHistory(params: SessionsParams = {}) {
  return useQuery({
    queryKey: ['sessions-history', params],
    queryFn: async () => {
      const response = await api.get('/sessions', { params });
      return response.data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
