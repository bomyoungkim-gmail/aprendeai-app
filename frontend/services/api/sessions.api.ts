/**
 * Sessions API Service
 * 
 * Pure API calls for reading/study sessions.
 * No business logic - just HTTP requests.
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';

// ========================================
// TYPES
// ========================================

export interface StartSessionPayload {
  contentId: string;
  mode?: 'SOLO' | 'GROUP';
}

export interface PromptPayload {
  text: string;
  metadata?: Record<string, any>;
}

// ========================================
// API CALLS
// ========================================

export const sessionsApi = {
  /**
   * Start a new reading session
   */
  startSession: async (payload: StartSessionPayload) => {
    const { data } = await api.post(API_ENDPOINTS.SESSIONS.START, payload);
    return data;
  },

  /**
   * Get session details
   */
  getSession: async (id: string) => {
    const { data } = await api.get(API_ENDPOINTS.SESSIONS.GET(id));
    return data;
  },

  /**
   * Send prompt to AI during session
   */
  sendPrompt: async (id: string, payload: PromptPayload) => {
    const { data } = await api.post(API_ENDPOINTS.SESSIONS.PROMPT(id), payload);
    return data;
  },

  /**
   * Finish session
   */
  finishSession: async (id: string) => {
    const { data } = await api.post(API_ENDPOINTS.SESSIONS.FINISH(id));
    return data;
  },

  /**
   * Get session events
   */
  getEvents: async (id: string) => {
    const { data } = await api.get(API_ENDPOINTS.SESSIONS.EVENTS(id));
    return data;
  },

  /**
   * Get reading progress for a content
   */
  getProgress: async (contentId: string) => {
    const { data } = await api.get(API_ENDPOINTS.SESSIONS.GET_PROGRESS(contentId));
    return data;
  },

  /**
   * Update reading progress for a content
   */
  updateProgress: async (contentId: string, payload: { last_page: number; last_scroll_pct: number; device_info?: string }) => {
    const { data } = await api.post(API_ENDPOINTS.SESSIONS.UPDATE_PROGRESS(contentId), payload);
    return data;
  },

  /**
   * Get bookmarks for a content
   */
  getBookmarks: async (contentId: string) => {
    const { data } = await api.get(API_ENDPOINTS.SESSIONS.GET_BOOKMARKS(contentId));
    return data;
  },

  /**
   * Create a bookmark
   */
  createBookmark: async (contentId: string, payload: { page_number: number; scroll_pct?: number; label?: string; color?: string }) => {
    const { data } = await api.post(API_ENDPOINTS.SESSIONS.CREATE_BOOKMARK(contentId), payload);
    return data;
  },

  /**
   * Delete a bookmark
   */
  deleteBookmark: async (id: string) => {
    const { data } = await api.delete(API_ENDPOINTS.SESSIONS.DELETE_BOOKMARK(id));
    return data;
  },
};
