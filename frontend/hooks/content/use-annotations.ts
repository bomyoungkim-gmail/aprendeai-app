'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Annotation {
  id: string;
  type: 'HIGHLIGHT' | 'NOTE' | 'COMMENT';
  startOffset: number;
  endOffset: number;
  selectedText: string;
  text?: string;
  color?: string;
  visibility: 'PRIVATE' | 'GROUP' | 'PUBLIC';
  user: { id: string; name: string };
  replies?: Annotation[];
  createdAt: string;
}

export function useAnnotations(contentId: string, groupId?: string) {
  return useQuery({
    queryKey: ['annotations', contentId, groupId],
    queryFn: async () => {
      const params = groupId ? { groupId } : {};
      const response = await api.get(`/contents/${contentId}/annotations`, { params });
      return response.data as Annotation[];
    },
    enabled: !!contentId,
  });
}

export function useCreateAnnotation(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/contents/${contentId}/annotations`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', contentId] });
    },
  });
}

export function useUpdateAnnotation(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const response = await api.put(`/contents/${contentId}/annotations/${id}`, { text });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', contentId] });
    },
  });
}

export function useDeleteAnnotation(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contents/${contentId}/annotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', contentId] });
    },
  });
}

export function useSearchAnnotations(params: any) {
  return useQuery({
    queryKey: ['annotations', 'search', params],
    queryFn: async () => {
      const response = await api.get('/annotations/search', { params });
      return response.data as Annotation[];
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/annotations/${id}/favorite`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations'] });
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ annotationId, content }: { annotationId: string; content: string }) => {
      const response = await api.post(`/annotations/${annotationId}/reply`, { text: content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations'] });
    },
  });
}
