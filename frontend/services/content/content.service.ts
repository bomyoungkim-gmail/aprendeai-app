/**
 * Content Domain Service
 * 
 * Business logic for content management.
 * Uses contentApi for HTTP calls.
 */

import { contentApi } from '../api/content.api';
import type { CreateContentPayload, UpdateContentPayload } from '../api/content.api';

// ========================================
// SERVICE
// ========================================

export const contentService = {
  /**
   * Fetch all user's content
   */
  async fetchAll() {
    try {
      const contents = await contentApi.getMyContents();
      return contents;
    } catch (error) {
      console.error('[ContentService] Failed to fetch contents:', error);
      throw error;
    }
  },

  /**
   * Fetch single content
   */
  async fetchById(id: string) {
    if (!id) {
      throw new Error('Content ID is required');
    }

    try {
      const content = await contentApi.getContent(id);
      return content;
    } catch (error) {
      console.error(`[ContentService] Failed to fetch content ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new content
   */
  async create(payload: CreateContentPayload) {
    // Validation
    if (!payload.title?.trim()) {
      throw new Error('Title is required');
    }

    try {
      const newContent = await contentApi.createContent(payload);
      return newContent;
    } catch (error) {
      console.error('[ContentService] Failed to create content:', error);
      throw error;
    }
  },

  /**
   * Update content
   */
  async update(id: string, payload: UpdateContentPayload) {
    if (!id) {
      throw new Error('Content ID is required');
    }

    try {
      const updated = await contentApi.updateContent(id, payload);
      return updated;
    } catch (error) {
      console.error(`[ContentService] Failed to update content ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete content
   */
  async delete(id: string) {
    if (!id) {
      throw new Error('Content ID is required');
    }

    try {
      await contentApi.deleteContent(id);
    } catch (error) {
      console.error(`[ContentService] Failed to delete content ${id}:`, error);
      throw error;
    }
  },
};
