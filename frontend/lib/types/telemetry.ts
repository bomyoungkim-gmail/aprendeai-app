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
  | 'highlight_created'
  | 'highlight_updated'
  | 'highlight_deleted'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted';

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
