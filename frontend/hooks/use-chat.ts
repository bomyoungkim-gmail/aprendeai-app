import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SendChatMessageDto {
  roundIndex: number;
  message: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  roundId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  userRole: string | null;
}

export function useChatHistory(sessionId: string, roundIndex: number) {
  return useQuery({
    queryKey: ['chat', sessionId, roundIndex],
    queryFn: async () => {
      const { data } = await api.get<ChatMessage[]>(
        `/groups/sessions/${sessionId}/chat?roundIndex=${roundIndex}`
      );
      return data;
    },
    enabled: !!sessionId && roundIndex > 0,
  });
}

export function useSendChatMessage(sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: SendChatMessageDto) => {
      const { data } = await api.post<ChatMessage>(
        `/groups/sessions/${sessionId}/chat`,
        dto
      );
      return data;
    },
    onSuccess: (data) => {
      // Optimistically add to cache
      queryClient.setQueryData(
        ['chat', sessionId, data.roundId],
        (old: ChatMessage[] = []) => [...old, data]
      );
    },
  });
}
