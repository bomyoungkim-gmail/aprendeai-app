import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Institution, TeacherApproval, ProcessApprovalDto } from '@/lib/types/institution';

export function useMyInstitution() {
  return useQuery({
    queryKey: ['institutions', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<Institution>('/institutions/my-institution');
      return data;
    },
  });
}

export function usePendingApprovals(institutionId: string) {
  return useQuery({
    queryKey: ['institutions', institutionId, 'pending'],
    queryFn: async () => {
      const { data } = await api.get<TeacherApproval[]>(`/institutions/${institutionId}/pending`);
      return data;
    },
    enabled: !!institutionId,
  });
}

export function useProcessApproval(institutionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, dto }: { approvalId: string; dto: ProcessApprovalDto }) => {
      const { data } = await api.post(`/institutions/${institutionId}/pending/${approvalId}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions', institutionId, 'pending'] });
    },
  });
}
