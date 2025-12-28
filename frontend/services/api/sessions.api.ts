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
};
