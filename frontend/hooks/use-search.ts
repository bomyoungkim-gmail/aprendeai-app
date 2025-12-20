'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SearchParams {
  query: string;
  contentType?: string;
  language?: string;
  searchIn?: 'content' | 'annotation' | 'note' | 'transcript';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  type: 'content' | 'annotation' | 'note' | 'transcript';
  title: string;
  snippet: string;
  relevance: number;
  metadata: any;
  createdAt: string;
}

export function useSearch(params: SearchParams) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const response = await api.get(`/search?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!params.query && params.query.length > 0,
  });
}
