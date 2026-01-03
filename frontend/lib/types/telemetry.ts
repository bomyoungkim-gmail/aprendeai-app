import { ContentMode } from './content-mode';

// Telemetry Event Types
export interface TelemetryEvent {
  eventType: string;
  eventVersion: string;
  uiPolicyVersion: string;
  sessionId: string;
  userId?: string;
  contentId?: string;
  mode?: ContentMode;
  data: Record<string, any>;
  timestamp: number;
}

export interface BatchEventsPayload {
  events: TelemetryEvent[];
}

// Event Types
export type SessionEventType = 
  | 'session_started'
  | 'session_ended'
  | 'session_paused'
  | 'session_resumed';

export type SectionEventType =
  | 'section_viewed'
  | 'section_exited'
  | 'section_completed';

export type NavigationEventType =
  | 'navigation_jump'
  | 'navigation_back'
  | 'navigation_forward';

export type AnnotationEventType =
  | 'evidence_created'
  | 'evidence_updated'
  | 'evidence_deleted'
  | 'vocabulary_created'
  | 'vocabulary_updated'
  | 'vocabulary_deleted'
  | 'main_idea_created'
  | 'main_idea_updated'
  | 'main_idea_deleted'
  | 'doubt_created'
  | 'doubt_updated'
  | 'doubt_deleted'
  | 'synthesis_created'
  | 'synthesis_updated'
  | 'synthesis_deleted';

export type UIEventType =
  | 'ui_toggled'
  | 'panel_switched'
  | 'menu_opened';

export type EventType =
  | SessionEventType
  | SectionEventType
  | NavigationEventType
  | AnnotationEventType
  | UIEventType;
