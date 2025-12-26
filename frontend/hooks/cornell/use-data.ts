import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cornellApi } from '../lib/api/cornell';
import type {
  Content,
  CornellNotes,
  Highlight,
  UpdateCornellDto,
  CreateHighlightDto,
  UpdateHighlightDto,
} from '../lib/types/cornell';

// Query Keys
export const cornellKeys = {
  all: ['cornell'] as const,
  content: (id: string) => [...cornellKeys.all, 'content', id] as const,
  notes: (contentId: string) => [...cornellKeys.all, 'notes', contentId] as const,
  highlights: (contentId: string) => [...cornellKeys.all, 'highlights', contentId] as const,
};

// Content Hook
export function useContent(contentId: string) {
  return useQuery({
    queryKey: cornellKeys.content(contentId),
    queryFn: () => cornellApi.getContent(contentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Cornell Notes Hooks
export function useCornellNotes(contentId: string) {
  return useQuery({
    queryKey: cornellKeys.notes(contentId),
    queryFn: () => cornellApi.getCornellNotes(contentId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateCornellNotes(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateCornellDto) =>
      cornellApi.updateCornellNotes(contentId, updates),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(cornellKeys.notes(contentId), data);
    },
    onError: (error) => {
      console.error('Failed to update Cornell notes:', error);
    },
  });
}

// Highlights Hooks
export function useHighlights(contentId: string) {
  return useQuery({
    queryKey: cornellKeys.highlights(contentId),
    queryFn: () => cornellApi.getHighlights(contentId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateHighlight(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (highlight: CreateHighlightDto) =>
      cornellApi.createHighlight(contentId, highlight),
    onSuccess: (newHighlight) => {
      // Add to cache
      queryClient.setQueryData<Highlight[]>(
        cornellKeys.highlights(contentId),
        (old) => (old ? [...old, newHighlight] : [newHighlight])
      );
    },
  });
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateHighlightDto }) =>
      cornellApi.updateHighlight(id, updates),
    onSuccess: (updatedHighlight, { id }) => {
      // Update in cache
      queryClient.setQueriesData<Highlight[]>(
        { queryKey: cornellKeys.all },
        (old) => old?.map((h) => (h.id === id ? updatedHighlight : h))
      );
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (highlightId: string) => cornellApi.deleteHighlight(highlightId),
    onSuccess: (_, highlightId) => {
      // Remove from cache
      queryClient.setQueriesData<Highlight[]>(
        { queryKey: cornellKeys.all },
        (old) => old?.filter((h) => h.id !== highlightId)
      );
    },
  });
}
