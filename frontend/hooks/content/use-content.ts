/**
 * use-content Hook
 * 
 * React Query hook for content management.
 * Uses contentService for business logic.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/services';
import type { CreateContentPayload, UpdateContentPayload } from '@/services/api/content.api';

// ========================================
// QUERY HOOKS
// ========================================

/**
 * Fetch all user's content
 */
export function useContents() {
  return useQuery({
    queryKey: ['contents'],
    queryFn: () => contentService.fetchAll(),
  });
}

/**
 * Fetch single content by ID
 */
export function useContent(id: string) {
  return useQuery({
    queryKey: ['contents', id],
    queryFn: () => contentService.fetchById(id),
    enabled: !!id,
  });
}

// ========================================
// MUTATION HOOKS
// ========================================

/**
 * Create new content
 */
export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContentPayload) => contentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}

/**
 * Update content
 */
export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContentPayload }) => 
      contentService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['contents', variables.id] });
    },
  });
}

/**
 * Delete content
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}
