/**
 * Cornell Highlights Hook
 * 
 * React Query hooks for Cornell Notes highlights CRUD operations.
 * Integrates with backend API with optimistic updates and caching.
 * Supports offline operations with automatic queue.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/use-api-client';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { offlineQueue } from '@/lib/cornell/offline-queue';
import type {
  AnnotationVisibility,
  VisibilityScope,
  ContextType,
  TargetType,
} from '@/lib/constants/enums';
import type { CornellType } from '@/lib/cornell/type-color-map';

// ========================================
// TYPES
// ========================================

export interface CreateHighlightData {
  type: Exclude<CornellType, 'SUMMARY' | 'AI_RESPONSE'>;
  target_type: TargetType;
  page_number?: number;
  anchor_json?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp_ms?: number;
  duration_ms?: number;
  comment_text?: string;
  visibility?: AnnotationVisibility;
  visibility_scope?: VisibilityScope;
  context_type?: ContextType;
  context_id?: string;
  learner_id?: string;
}

export interface UpdateVisibilityData {
  visibility: AnnotationVisibility;
  visibility_scope?: VisibilityScope;
  context_type?: ContextType;
  context_id?: string;
  learner_id?: string;
}

export interface Highlight {
  id: string;
  contentId: string;
  userId: string;
  kind: 'TEXT' | 'AREA';
  targetType: TargetType;
  pageNumber?: number;
  anchorJson: any;
  timestampMs?: number;
  durationMs?: number;
  colorKey: string;
  tagsJson: string[];
  commentText?: string;
  visibility: AnnotationVisibility;
  visibilityScope?: VisibilityScope;
  contextType?: ContextType;
  contextId?: string;
  learnerId?: string;
  status: 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  comments?: HighlightComment[];
}

export interface HighlightComment {
  id: string;
  highlightId: string;
  userId: string;
  text: string;
  status: 'ACTIVE' | 'DELETED';
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

// ========================================
// QUERY KEYS
// ========================================

export const cornellKeys = {
  all: ['cornell-highlights'] as const,
  lists: () => [...cornellKeys.all, 'list'] as const,
  list: (contentId: string) => [...cornellKeys.lists(), contentId] as const,
  details: () => [...cornellKeys.all, 'detail'] as const,
  detail: (id: string) => [...cornellKeys.details(), id] as const,
};

// ========================================
// HOOKS
// ========================================

/**
 * Get all highlights for a content
 */
export function useGetHighlights(contentId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: cornellKeys.list(contentId),
    queryFn: async () => {
      const response = await api.get<Highlight[]>(
        `/cornell/contents/${contentId}/highlights`
      );
      return response.data;
    },
    enabled: !!contentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new highlight
 */
export function useCreateHighlight(contentId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (data: CreateHighlightData) => {
      // If offline, queue the operation
      if (!isOnline) {
        offlineQueue.add({
          type: 'CREATE',
          contentId,
          payload: data,
        });
        throw new Error('Offline - operation queued');
      }

      const response = await api.post<Highlight>(
        `/cornell/contents/${contentId}/highlights`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: cornellKeys.list(contentId) });
    },
  });
}

/**
 * Update highlight visibility
 */
export function useUpdateVisibility(highlightId: string, contentId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVisibilityData) => {
      const response = await api.patch<Highlight>(
        `/cornell/highlights/${highlightId}/visibility`,
        data
      );
      return response.data;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cornellKeys.list(contentId) });

      // Snapshot previous value
      const previousHighlights = queryClient.getQueryData<Highlight[]>(
        cornellKeys.list(contentId)
      );

      // Optimistically update
      if (previousHighlights) {
        queryClient.setQueryData<Highlight[]>(
          cornellKeys.list(contentId),
          previousHighlights.map((h) =>
            h.id === highlightId
              ? {
                  ...h,
                  visibility: newData.visibility,
                  visibilityScope: newData.visibility_scope,
                  contextType: newData.context_type,
                  contextId: newData.context_id,
                  learnerId: newData.learner_id,
                }
              : h
          )
        );
      }

      return { previousHighlights };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousHighlights) {
        queryClient.setQueryData(
          cornellKeys.list(contentId),
          context.previousHighlights
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cornellKeys.list(contentId) });
    },
  });
}

/**
 * Delete highlight (soft delete)
 */
export function useDeleteHighlight(contentId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: string) => {
      await api.delete(`/cornell/highlights/${highlightId}`);
    },
    onMutate: async (highlightId) => {
      await queryClient.cancelQueries({ queryKey: cornellKeys.list(contentId) });

      const previousHighlights = queryClient.getQueryData<Highlight[]>(
        cornellKeys.list(contentId)
      );

      // Optimistically remove
      if (previousHighlights) {
        queryClient.setQueryData<Highlight[]>(
          cornellKeys.list(contentId),
          previousHighlights.filter((h) => h.id !== highlightId)
        );
      }

      return { previousHighlights };
    },
    onError: (err, highlightId, context) => {
      if (context?.previousHighlights) {
        queryClient.setQueryData(
          cornellKeys.list(contentId),
          context.previousHighlights
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cornellKeys.list(contentId) });
    },
  });
}

/**
 * Create comment on highlight
 */
export function useCreateComment(highlightId: string, contentId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post<HighlightComment>(
        `/cornell/highlights/${highlightId}/comments`,
        { text }
      );
      return response.data;
    },
    onSuccess: () => {
      // Refetch highlights to get updated comments
      queryClient.invalidateQueries({ queryKey: cornellKeys.list(contentId) });
    },
  });
}
