'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SearchParams {
  q: string;
  type?: 'PDF' | 'DOCX';
  language?: string;
  page?: number;
  limit?: number;
}

export function useContentSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['content-search', params],
    queryFn: async () => {
      if (!params.q || params.q.length < 2) {
        return { results: [], metadata: { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false } };
      }

      const response = await api.get('/contents/search', { params });
      return response.data;
    },
    enabled: params.q.length >= 2, // Only search if query is 2+ chars
    staleTime: 30000, // Cache for 30 seconds
  });
}
