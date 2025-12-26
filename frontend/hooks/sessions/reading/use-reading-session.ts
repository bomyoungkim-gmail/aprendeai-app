'use client';

import { useQuery } from '@tanstack/react-query';
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
