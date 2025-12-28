/**
 * Highlights Service
 * 
 * Business logic for Cornell highlights/annotations.
 * Handles transformations, validations, and offline queue.
 */

import { cornellApi, type CreateHighlightPayload, type UpdateHighlightPayload } from '../api/cornell.api';
import { offlineQueue } from '@/lib/cornell/offline-queue';
import type { VisibilityConfig } from '@/lib/cornell/visibility-config';

// ========================================
// TYPES
// ========================================

export interface CreateHighlightOptions {
  isOnline: boolean;
}

// ========================================
// BUSINESS LOGIC
// ========================================

export const highlightsService = {
  /**
   * Create a highlight with offline support
   */
  async createHighlight(
    contentId: string,
    payload: CreateHighlightPayload,
    options: CreateHighlightOptions
  ) {
    // Offline mode: queue for later
    if (!options.isOnline) {
      await offlineQueue.add({
        type: 'CREATE',
        contentId,
        payload: payload,
      });
      
      // Return optimistic response
      return {
        id: `temp-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
    }

    // Online mode: call API
    const result = await cornellApi.createHighlight(contentId, payload);
    return result;
  },

  /**
   * Update highlight with offline support
   */
  async updateHighlight(
    contentId: string,
    highlightId: string,
    payload: UpdateHighlightPayload,
    options: CreateHighlightOptions
  ) {
    if (!options.isOnline) {
      await offlineQueue.add({
        type: 'UPDATE',
        contentId,
        // highlightId is sent as part of payload or logic needs to handle it. 
        // offlineQueue.add puts additional props into ...operation
        // QueuedOperation interface has contentId, payload. It doesn't strictly have highlightId at top level unless we add it.
        // Looking at offline-queue add method: const queuedOp = { ...operation }
        // We generally put extra data in payload or root if interface allows.
        // QueuedOperation interface has id, type, contentId, payload. 
        // We should put highlightId inside payload or rely on 'any' nature of payload.
        // Ideally we'd add highlightId to QueuedOperation but payload is any.
        payload: { ...payload, highlightId }, 
      });
      
      return { id: highlightId, ...payload };
    }

    const result = await cornellApi.updateHighlight(contentId, highlightId, payload);
    return result;
  },

  /**
   * Delete highlight with offline support
   */
  async deleteHighlight(
    contentId: string,
    highlightId: string,
    options: CreateHighlightOptions
  ) {
    if (!options.isOnline) {
      await offlineQueue.add({
        type: 'DELETE',
        contentId,
        payload: { highlightId },
      });
      
      return { success: true };
    }

    const result = await cornellApi.deleteHighlight(contentId, highlightId);
    return result;
  },

  /**
   * Update visibility
   */
  async updateVisibility(
    contentId: string,
    highlightId: string,
    visibilityConfig: VisibilityConfig
  ) {
    const payload = {
      visibility: visibilityConfig.visibility,
      visibility_scope: visibilityConfig.visibility_scope,
      context_type: visibilityConfig.context_type,
      context_id: visibilityConfig.context_id,
    };

    const result = await cornellApi.updateHighlightVisibility(
      contentId,
      highlightId,
      payload
    );
    return result;
  },
};
