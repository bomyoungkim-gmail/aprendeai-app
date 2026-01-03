import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cornellApi } from '@/lib/api/cornell';
import type {
  Content,
  CornellNotes,
  Highlight,
  UpdateCornellDto,
  CreateHighlightDto,
  UpdateHighlightDto,
  CreateHighlightPayload,
} from '@/lib/types/cornell';
import { logger } from '@/lib/utils/logger';

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
    
    // 🚀 Optimistic Updates
    onMutate: async (updates) => {
      // Cancel refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: cornellKeys.notes(contentId) });

      // Snapshot the previous value
      const previousNotes = queryClient.getQueryData<CornellNotes>(cornellKeys.notes(contentId));

      // Optimistically update to the new value
      if (previousNotes) {
        queryClient.setQueryData<CornellNotes>(cornellKeys.notes(contentId), {
          ...previousNotes,
          ...updates,
          updatedAt: new Date().toISOString(), // Temporary proxy
        });
      }

      // Return context with snapshotted value
      return { previousNotes };
    },

    onError: (error, _updates, context) => {
      logger.error('Failed to update Cornell notes', error, { contentId });
      // Rollback to previous value
      if (context?.previousNotes) {
        queryClient.setQueryData(cornellKeys.notes(contentId), context.previousNotes);
      }
    },

    onSuccess: (data) => {
      // Update with final data from server
      queryClient.setQueryData(cornellKeys.notes(contentId), data);
    },
    
    onSettled: () => {
      // Always refetch in background to ensure sync
      queryClient.invalidateQueries({ queryKey: cornellKeys.notes(contentId) });
    }
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
    mutationFn: (highlight: CreateHighlightDto) => {
      const payload: CreateHighlightPayload = {
        type: highlight.tags_json?.[0] || 'HIGHLIGHT',
        kind: highlight.kind,
        target_type: highlight.target_type,
        page_number: highlight.page_number,
        timestamp_ms: highlight.timestamp_ms,
        anchor_json: highlight.anchor_json,
        comment_text: highlight.comment_text,
        visibility: highlight.visibility,
        visibility_scope: highlight.visibility_scope,
        context_type: highlight.context_type,
        context_id: highlight.context_id,
      };
      return cornellApi.createHighlight(contentId, payload);
    },
    onSuccess: () => {
      // Invalidate highlights to refetch and show new highlight
      queryClient.invalidateQueries({ queryKey: cornellKeys.highlights(contentId) });
    },
  });
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateHighlightDto }) =>
      cornellApi.updateHighlight(id, updates),
    onSuccess: () => {
      // Invalidate all highlights queries to refetch
      queryClient.invalidateQueries({ queryKey: cornellKeys.all });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (highlightId: string) => cornellApi.deleteHighlight(highlightId),
    onSuccess: () => {
      // Invalidate all highlights queries to refetch
      queryClient.invalidateQueries({ queryKey: cornellKeys.all });
    },
  });
}
