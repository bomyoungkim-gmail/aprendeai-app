import api from '@/lib/api';
import type {
  Content,
  CornellNotes,
  Highlight,
  UpdateCornellDto,
  CreateHighlightDto,
  UpdateHighlightDto,
} from '../types/cornell';
import { API_ENDPOINTS } from '@/lib/config/api';

// Cornell Reader API
export const cornellApi = {
  // Content
  async getContent(contentId: string): Promise<Content> {
    const response = await api.get(API_ENDPOINTS.CONTENTS.GET(contentId));
    return response.data;
  },
  
  async deleteContent(contentId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.CONTENTS.DELETE(contentId));
  },

  async bulkDeleteContents(contentIds: string[]): Promise<{ deleted: number; skipped: number }> {
    const response = await api.post(API_ENDPOINTS.CONTENTS.BULK_DELETE, { contentIds });
    return response.data;
  },

  async getFileViewUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    const { data } = await api.get(API_ENDPOINTS.CONTENTS.FILE_VIEW_URL(fileId));
    return data;
  },

  // Cornell Notes
  async getCornellNotes(contentId: string): Promise<CornellNotes> {
    const { data } = await api.get(API_ENDPOINTS.CORNELL_NOTES(contentId));
    return data;
  },

  async updateCornellNotes(
    contentId: string,
    updates: UpdateCornellDto
  ): Promise<CornellNotes> {
    const payload: any = {};
    if (updates.summary_text !== undefined) payload.summary_text = updates.summary_text;
    if (updates.cues_json !== undefined) payload.cues_json = updates.cues_json;
    if (updates.notes_json !== undefined) payload.notes_json = updates.notes_json;

    const { data } = await api.put(API_ENDPOINTS.CORNELL_NOTES(contentId), payload);
    return data;
  },

  // Highlights
  async getHighlights(contentId: string): Promise<Highlight[]> {
    const { data } = await api.get(API_ENDPOINTS.HIGHLIGHTS(contentId));
    return data;
  },

  async createHighlight(
    contentId: string,
    highlight: CreateHighlightDto | any
  ): Promise<Highlight> {
    const { data } = await api.post(API_ENDPOINTS.HIGHLIGHTS(contentId), highlight);
    return data;
  },

  async updateHighlightVisibility(
    contentId: string,
    highlightId: string,
    payload: { visibility: string; visibility_scope?: string; context_type?: string; context_id?: string }
  ): Promise<any> {
    const { data } = await api.patch(API_ENDPOINTS.HIGHLIGHT_VISIBILITY(contentId, highlightId), payload);
    return data;
  },

  async updateHighlight(
    highlightId: string,
    updates: UpdateHighlightDto
  ): Promise<Highlight> {
    const { data} = await api.put(API_ENDPOINTS.HIGHLIGHT(highlightId), updates);
    return data;
  },

  async deleteHighlight(highlightId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HIGHLIGHT(highlightId));
  },

  // Content Creation
  async createManualContent(data: { type: 'VIDEO' | 'TEXT' | 'PDF'; sourceUrl?: string; text?: string; title: string }): Promise<Content> {
    const { data: response } = await api.post(API_ENDPOINTS.CONTENTS.CREATE_MANUAL, data);
    return response;
  },

  async uploadContent(file: File): Promise<Content> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(API_ENDPOINTS.CONTENTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
