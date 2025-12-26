import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { StudyGroup, CreateGroupDto, InviteMemberDto } from '@/lib/types/study-groups';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await api.get<StudyGroup[]>('/groups');
      return data;
    },
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const { data} = await api.get<StudyGroup>(`/groups/${groupId}`);
      return data;
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: CreateGroupDto) => {
      const { data } = await api.post<StudyGroup>('/groups', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useInviteGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: InviteMemberDto) => {
      await api.post(`/groups/${groupId}/members/invite`, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useAddContent(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contentId: string) => {
      await api.post(`/groups/${groupId}/contents`, { contentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useRemoveContent(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contentId: string) => {
      await api.delete(`/groups/${groupId}/contents/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useGroupSessions(groupId: string) {
  return useQuery({
    queryKey: ['group-sessions', groupId],
    queryFn: async () => {
      const { data } = await api.get(`/groups/${groupId}/sessions`);
      return data;
    },
  });
}
