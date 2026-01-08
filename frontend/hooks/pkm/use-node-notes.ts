import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pkmApi, CreatePkmNoteRequest } from '@/services/api/pkm.api';

export function useNodeNotes(topicNodeId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['node-notes', topicNodeId],
    queryFn: () => topicNodeId ? pkmApi.getNotesByNodeId(topicNodeId) : Promise.resolve([]),
    enabled: !!topicNodeId,
  });

  const createNote = useMutation({
    mutationFn: (data: CreatePkmNoteRequest) => pkmApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['node-notes', topicNodeId] });
      // Invalidate learner graph to update annotation counts
      queryClient.invalidateQueries({ queryKey: ['learner-graph'] });
    },
  });

  return { notes, isLoading, createNote };
}
