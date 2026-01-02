/**
 * Content API Service
 * 
 * Pure API calls for content management.
 * No business logic - just HTTP requests.
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { ContentType } from '@/lib/constants/enums';

// ========================================
// TYPES
// ========================================

export interface CreateContentPayload {
  title: string;
  type: ContentType;
  url?: string;
  filePath?: string;
}

export interface UpdateContentPayload {
  title?: string;
}

// ========================================
// API CALLS
// ========================================

export const contentApi = {
  /**
   * Get all my contents
   */
  getMyContents: async () => {
    const { data } = await api.get(API_ENDPOINTS.CONTENTS.MY_CONTENTS);
    return data;
  },

  /**
   * Get single content by ID
   */
  getContent: async (id: string) => {
    const { data } = await api.get(API_ENDPOINTS.CONTENTS.GET(id));
    return data;
  },

  /**
   * Create new content
   */
  createContent: async (payload: CreateContentPayload) => {
    const { data } = await api.post(API_ENDPOINTS.CONTENTS.LIST, payload);
    return data;
  },

  /**
   * Update content
   */
  updateContent: async (id: string, payload: UpdateContentPayload) => {
    const { data } = await api.patch(API_ENDPOINTS.CONTENTS.GET(id), payload);
    return data;
  },

  /**
   * Delete content
   */
  deleteContent: async (id: string) => {
    const { data } = await api.delete(API_ENDPOINTS.CONTENTS.DELETE(id));
    return data;
  },
};
