import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUploadContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/contents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data; // Returns { id, title, ... }
    },
    onSuccess: (data) => {
      // Invalidate content queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['my-contents'] });
      // Return data for redirect
      return data;
    },
  });
}
