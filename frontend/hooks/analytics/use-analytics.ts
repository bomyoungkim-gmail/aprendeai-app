import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SessionMetrics {
  sessionId: string;
  totalTimeMs: number;
  scrollDepth: number;
  highlightsCount: number;
  notesCount: number;
  dominantMode: string;
  startTime: string;
  endTime: string;
}

export interface DailyEngagement {
  date: string;
  totalTimeMs: number;
  contentsRead: number;
  sessionsCount: number;
}

export function useSessionAnalytics(contentId: string) {
  return useQuery({
    queryKey: ['analytics', 'session', contentId],
    queryFn: async () => {
      const { data } = await api.get<SessionMetrics>(`/analytics/session/${contentId}`);
      return data;
    },
    enabled: !!contentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDailyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'daily'],
    queryFn: async () => {
      const { data } = await api.get<DailyEngagement>('/analytics/daily');
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
