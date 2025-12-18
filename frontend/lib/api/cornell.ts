import axios from 'axios';
import type {
  Content,
  CornellNotes,
  Highlight,
  UpdateCornellDto,
  CreateHighlightDto,
  UpdateHighlightDto,
} from '../types/cornell';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with auth
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  // Get token from zustand store (works in browser)
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      const token = state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// Cornell Reader API
export const cornellApi = {
  // Content
  async getContent(contentId: string): Promise<Content> {
    const { data } = await api.get(`/contents/${contentId}`);
    return data;
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

export default api;
