import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { GroupSession, CreateSessionDto, GroupEvent, SharedCard, SubmitEventDto } from '@/lib/types/study-groups';

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: async () => {
      const { data } = await api.get<GroupSession>(`/group-sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, dto }: { groupId: string; dto: CreateSessionDto }) => {
      const { data } = await api.post<GroupSession>(`/group-sessions?groupId=${groupId}`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}

export function useStartSession(sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await api.put(`/group-sessions/${sessionId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
  });
}

export function useAdvanceRound(sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roundIndex, toStatus }: { roundIndex: number; toStatus: string }) => {
      await api.post(`/group-sessions/${sessionId}/rounds/${roundIndex}/advance`, { toStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
  });
}

export function useSubmitEvent(sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: SubmitEventDto) => {
      await api.post(`/group-sessions/${sessionId}/events`, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['events', sessionId] });
    },
  });
}

export function useSessionEvents(sessionId: string, roundIndex?: number) {
  return useQuery({
    queryKey: ['events', sessionId, roundIndex],
    queryFn: async () => {
      const params = roundIndex !== undefined ? `?roundIndex=${roundIndex}` : '';
      const { data } = await api.get<GroupEvent[]>(`/group-sessions/${sessionId}/events${params}`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useSharedCards(sessionId: string) {
  return useQuery({
    queryKey: ['sharedCards', sessionId],
    queryFn: async () => {
      const { data } = await api.get<SharedCard[]>(`/group-sessions/${sessionId}/shared-cards`);
      return data;
    },
    enabled: !!sessionId,
  });
}
