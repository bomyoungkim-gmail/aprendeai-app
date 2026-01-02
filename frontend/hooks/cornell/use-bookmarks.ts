
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/services/api/sessions.api';

export function useBookmarks(contentId: string) {
  return useQuery({
    queryKey: ['bookmarks', contentId],
    queryFn: () => sessionsApi.getBookmarks(contentId),
    enabled: !!contentId,
  });
}

export function useCreateBookmark(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { page_number: number; scroll_pct?: number; label?: string }) =>
      sessionsApi.createBookmark(contentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', contentId] });
    },
  });
}

export function useDeleteBookmark(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', contentId] });
    },
  });
}
