import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '@/lib/api/family';
import { CreateFamilyDto, InviteMemberDto } from '@/lib/types/family';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getFamilies,
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: ['families', id],
    queryFn: () => familyApi.getFamily(id),
    enabled: !!id,
  });
}

export function useFamilyUsage(id: string) {
  return useQuery({
    queryKey: ['families', id, 'usage'],
    queryFn: () => familyApi.getUsage(id),
    enabled: !!id,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  
  return useMutation({
    mutationFn: (dto: CreateFamilyDto) => familyApi.createFamily(dto),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      // Refresh user data to get updated primaryFamilyId (set by backend)
      await refreshUser?.();
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, dto }: { familyId: string; dto: InviteMemberDto }) =>
      familyApi.inviteMember(familyId, dto),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['families', familyId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, userId }: { familyId: string; userId: string }) =>
      familyApi.removeMember(familyId, userId),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['families', familyId] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  
  return useMutation({
    mutationFn: (familyId: string) => familyApi.acceptInvite(familyId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      // Refresh user data to get updated primaryFamilyId (first invite sets Primary)
      await refreshUser?.();
    },
  });
}
export function useDeleteFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) => familyApi.deleteFamily(familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

export function useSetPrimaryFamily() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  
  return useMutation({
    mutationFn: (familyId: string) => familyApi.setPrimary(familyId),
    onSuccess: async () => {
      // Invalidate families list
      queryClient.invalidateQueries({ queryKey: ['families'] });
      
      // Refresh user data to get updated primaryFamilyId
      await refreshUser?.();
    },
  });
}
