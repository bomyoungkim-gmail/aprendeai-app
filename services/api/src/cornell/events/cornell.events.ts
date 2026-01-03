/**
 * Cornell Notes Events
 *
 * Event definitions for real-time notifications.
 */

export enum CornellEvent {
  ANNOTATION_CREATED = "cornell.annotation.created",
  ANNOTATION_UPDATED = "cornell.annotation.updated",
  ANNOTATION_DELETED = "cornell.annotation.deleted",
  COMMENT_ADDED = "cornell.comment.added",
}

export interface CornellEventPayload {
  contentId: string;
  highlightId: string;
  userId: string;
  action: CornellEvent;
  timestamp: number;
  data?: any;
}
