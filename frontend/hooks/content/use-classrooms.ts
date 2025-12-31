import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Classroom, CreateClassroomDto, GradebookGrid } from '@/lib/types/classroom';

export function useMyClassrooms() {
  return useQuery({
    queryKey: ['classrooms', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<Classroom[]>('/classrooms/mine');
      return data;
    },
  });
}

export function useGradebook(classroomId: string) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'gradebook'],
    queryFn: async () => {
      const { data } = await api.get<GradebookGrid>(`/classrooms/${classroomId}/gradebook`);
      return data;
    },
    enabled: !!classroomId,
  });
}

export function useClassroom(id: string) {
  return useQuery({
    queryKey: ['classrooms', id],
    queryFn: async () => {
      const { data } = await api.get<Classroom>(`/classrooms/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: CreateClassroomDto) => {
      const { data } = await api.post<Classroom>('/classrooms', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}
