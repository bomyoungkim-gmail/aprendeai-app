'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface RecommendationContent {
  id: string;
  title: string;
  type: string;
  originalLanguage: string;
  createdAt: string;
  ownerUser?: { id: string; name: string };
  progress?: number;
  popularity?: number;
}

interface Recommendations {
  continueReading: RecommendationContent[];
  recentReads: RecommendationContent[];
  popularInGroups: RecommendationContent[];
  similar: RecommendationContent[];
  trending: RecommendationContent[];
}

export function useRecommendations() {
  return useQuery<Recommendations>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await api.get('/recommendations');
      return response.data;
    },
  });
}
