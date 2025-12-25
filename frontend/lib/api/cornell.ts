import api from '@/lib/api';
import type {
  Content,
  CornellNotes,
  Highlight,
  UpdateCornellDto,
  CreateHighlightDto,
  UpdateHighlightDto,
} from '../types/cornell';

// Cornell Reader API
export const cornellApi = {
  // Content
  async getContent(contentId: string): Promise<Content> {
    const response = await api.get(`/contents/${contentId}`);
    return response.data;
  },
  
  async deleteContent(contentId: string): Promise<void> {
    await api.delete(`/contents/${contentId}`);
  },

  async bulkDeleteContents(contentIds: string[]): Promise<{ deleted: number; skipped: number }> {
    const response = await api.post('/contents/bulk-delete', { contentIds });
    return response.data;
  },

  async getFileViewUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    const { data } = await api.get(`/files/${fileId}/view-url`);
    return data;
  },

  // Cornell Notes
  async getCornellNotes(contentId: string): Promise<CornellNotes> {
    const { data } = await api.get(`/contents/${contentId}/cornell`);
    return data;
  },

  async updateCornellNotes(
    contentId: string,
    updates: UpdateCornellDto
  ): Promise<CornellNotes> {
    const { data } = await api.put(`/contents/${contentId}/cornell`, updates);
    return data;
  },

  // Highlights
  async getHighlights(contentId: string): Promise<Highlight[]> {
    const { data } = await api.get(`/contents/${contentId}/highlights`);
    return data;
  },

  async createHighlight(
    contentId: string,
    highlight: CreateHighlightDto
  ): Promise<Highlight> {
    const { data } = await api.post(`/contents/${contentId}/highlights`, highlight);
    return data;
  },

  async updateHighlight(
    highlightId: string,
    updates: UpdateHighlightDto
  ): Promise<Highlight> {
    const { data} = await api.put(`/highlights/${highlightId}`, updates);
    return data;
  },

  async deleteHighlight(highlightId: string): Promise<void> {
    await api.delete(`/highlights/${highlightId}`);
  },
};
