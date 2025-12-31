import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface CreateWeeklyPlanDto {
  weekStart: string;
  items: string[];
  toolWords?: string[];
}

export function useCreateWeeklyPlan(classroomId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: CreateWeeklyPlanDto) => {
      const { data } = await api.post(`/classrooms/${classroomId}/plans/weekly`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms', classroomId, 'plans'] });
    },
  });
}
