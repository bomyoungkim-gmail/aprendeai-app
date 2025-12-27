/**
 * Cornell Notes Events
 * 
 * Event definitions for real-time notifications.
 */

export enum CornellEvent {
  HIGHLIGHT_CREATED = 'cornell.highlight.created',
  HIGHLIGHT_UPDATED = 'cornell.highlight.updated',
  HIGHLIGHT_DELETED = 'cornell.highlight.deleted',
  COMMENT_ADDED = 'cornell.comment.added',
}

export interface CornellEventPayload {
  contentId: string;
  highlightId: string;
  userId: string;
  action: CornellEvent;
  timestamp: number;
  data?: any;
}
