import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface HeatmapData {
  date: string;
  minutesStudied: number;
  sessionsCount: number;
  contentsRead: number;
  annotationsCreated: number;
}

interface ActivityStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  avgMinutesPerDay: number;
  thisWeekMinutes: number;
  thisMonthMinutes: number;
}

/**
 * Get activity heatmap data
 */
export function useActivityHeatmap(days: number = 365) {
  return useQuery({
    queryKey: ['activity', 'heatmap', days],
    queryFn: async () => {
      const response = await apiClient.get<HeatmapData[]>(
        `/activity/heatmap?days=${days}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get activity statistics
 */
export function useActivityStats() {
  return useQuery({
    queryKey: ['activity', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<ActivityStats>('/activity/stats');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Track activity
 */
export function useTrackActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: 'study' | 'annotation' | 'read' | 'session';
      minutes?: number;
    }) => {
      const response = await apiClient.post('/activity/track', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate activity queries
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
