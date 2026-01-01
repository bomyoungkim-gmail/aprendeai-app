import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ContentMode, ContentModeInfo, UpdateContentModePayload } from '@/lib/types/content-mode';

interface ContentModeResponse {
  mode: ContentMode | null;
  modeSource: string | null;
  modeSetBy: string | null;
  modeSetAt: string | null;
  inferredMode?: ContentMode;
}

/**
 * Hook to get and manage content mode
 */
export function useContentMode(contentId: string | undefined) {
  const queryClient = useQueryClient();

  // Query to get content mode
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['content-mode', contentId],
    queryFn: async (): Promise<ContentModeResponse> => {
      if (!contentId) {
        throw new Error('Content ID is required');
      }
      const response = await api.get(`/cornell/contents/${contentId}/mode`);
      return response.data;
    },
    enabled: !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to update content mode
  const updateModeMutation = useMutation({
    mutationFn: async (payload: UpdateContentModePayload) => {
      if (!contentId) {
        throw new Error('Content ID is required');
      }
      const response = await api.put(`/cornell/contents/${contentId}/mode`, payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['content-mode', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    },
  });

  // Get effective mode (mode or inferredMode)
  const effectiveMode = data?.mode || data?.inferredMode || ContentMode.NARRATIVE;

  return {
    // Data
    mode: data?.mode || null,
    modeSource: data?.modeSource || null,
    modeSetBy: data?.modeSetBy || null,
    modeSetAt: data?.modeSetAt ? new Date(data.modeSetAt) : null,
    inferredMode: data?.inferredMode || null,
    effectiveMode,
    
    // State
    isLoading,
    error,
    
    // Actions
    updateMode: updateModeMutation.mutate,
    isUpdating: updateModeMutation.isPending,
    updateError: updateModeMutation.error,
    refetch,
  };
}

/**
 * Hook to get mode info without automatic fetching
 */
export function useContentModeInfo(contentId: string | undefined) {
  return useQuery({
    queryKey: ['content-mode', contentId],
    queryFn: async (): Promise<ContentModeInfo> => {
      if (!contentId) {
        throw new Error('Content ID is required');
      }
      const response = await api.get(`/cornell/contents/${contentId}/mode`);
      const data = response.data;
      
      return {
        mode: data.mode,
        modeSource: data.modeSource,
        modeSetBy: data.modeSetBy,
        modeSetAt: data.modeSetAt ? new Date(data.modeSetAt) : null,
      };
    },
    enabled: false, // Don't fetch automatically
  });
}
