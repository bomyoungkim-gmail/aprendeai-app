import { api } from './index';

export interface PkmNoteDto {
  id: string;
  topicNodeId?: string;
  title: string;
  bodyMd: string;
  status: string;
  createdAt: string;
}

export interface CreatePkmNoteRequest {
  title: string;
  bodyMd: string;
  topicNodeId?: string;
}

export const pkmApi = {
  getNotesByNodeId: async (topicNodeId: string) => {
    const response = await api.get<PkmNoteDto[]>('/pkm/notes', {
      params: { topicNodeId },
    });
    return response.data;
  },

  createNote: async (data: CreatePkmNoteRequest) => {
    const response = await api.post<PkmNoteDto>('/pkm/notes', data);
    return response.data;
  },
};
