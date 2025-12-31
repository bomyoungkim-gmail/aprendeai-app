import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Thread, Comment, GetThreadsQuery, CreateCommentDto, ShareContentRequest } from '@/lib/types/sharing';
import { API_ENDPOINTS } from '@/lib/config/api';

export function useThread(query: GetThreadsQuery) {
  return useQuery({
    queryKey: ['thread', query.contextType, query.contextId, query.targetType, query.targetId],
    queryFn: async () => {
      const { data } = await api.get<Thread>('/threads', { params: query });
      return data;
    },
    enabled: !!query.contextId && !!query.targetId,
  });
}

export function useAddComment(threadId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: CreateCommentDto) => {
      const { data } = await api.post<Comment>(`/threads/${threadId}/comments`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}

export function useDeleteComment(threadId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/threads/${threadId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}

export function useShareContent(contentId: string) {
  return useMutation({
    mutationFn: async (dto: ShareContentRequest) => {
      const { data } = await api.post(API_ENDPOINTS.CONTENTS.SHARES(contentId), dto);
      return data;
    },
  });
}
