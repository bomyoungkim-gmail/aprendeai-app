/**
 * Telemetry Event Types and Payload Definitions
 *
 * Standardizes all telemetry events for learning optimization.
 * Categories: Flow, Interface Load, Cornell, Learning Outcomes, Interventions
 */

// ============================================================================
// EVENT TYPE CONSTANTS
// ============================================================================

export const TelemetryEventType = {
  // A) Flow & Deep Reading
  SESSION_STARTED: "session_started",
  SECTION_VIEWED: "section_viewed",
  SCROLL_PATTERN: "scroll_pattern",
  CONTEXT_SWITCH: "context_switch",
  FLOW_STATE_DETECTED: "flow_state_detected", // SCRIPT 03 - GAP 8: Flow state metrics

  // B) Interface Load
  TOOLBOX_OPENED: "toolbox_opened",
  MENU_OPENED: "menu_opened",
  ACTION_SHORTCUT_USED: "action_shortcut_used",
  UNDO_REDO_USED: "undo_redo_used",

  // C) Cornell Core (Reference - from SCRIPT 06)
  CORNELL_HIGHLIGHT_CREATED: "cornell_highlight_created",
  CORNELL_SUMMARY_SUBMITTED: "cornell_summary_submitted",
  CORNELL_CUE_ADDED: "cornell_cue_added",
  CORNELL_NOTE_ADDED: "cornell_note_added",
  CORNELL_CHECKPOINT_ANSWERED: "cornell_checkpoint_answered",

  // D) Learning Outcomes
  MICRO_CHECK_ANSWERED: "micro_check_answered",
  SRS_REVIEW_DONE: "srs_review_done",
  ASSESSMENT_COMPLETED: "assessment_completed", // SCRIPT 08: Assessment submission

  // E) Interventions
  DECISION_APPLIED: "decision_applied",
  MISSION_ASSIGNED: "mission_assigned",
  MISSION_COMPLETED: "mission_completed",
} as const;

export type TelemetryEventTypeValue =
  (typeof TelemetryEventType)[keyof typeof TelemetryEventType];

// ============================================================================
// PAYLOAD INTERFACES
// ============================================================================

// A) Flow & Deep Reading Payloads

export interface SessionStartedPayload {
  contentId: string;
  mode: string;
  device: string;
  uiPolicyVersion: string;
}

export interface SectionViewedPayload {
  contentId: string;
  chunkId?: string;
  chunkIndex?: number;
  pageNumber?: number;
  dwellMs: number;
}

export interface ScrollPatternPayload {
  speed: number;
  jerk: number;
  backtrackCount: number;
}

export interface ContextSwitchPayload {
  to: "notes" | "glossary" | "menu" | "other_app";
  count: number;
}

export interface FlowStateDetectedPayload {
  confidence: number;
  readingVelocity: number;
  doubtCount: number;
  rehighlightRate: number;
  sessionDuration: number;
}

// B) Interface Load Payloads

export interface ToolboxOpenedPayload {
  tool: string;
  count: number;
}

export interface MenuOpenedPayload {
  menuId: string;
}

export interface ActionShortcutUsedPayload {
  action: string;
}

export interface UndoRedoUsedPayload {
  action: "undo" | "redo";
  count: number;
}

// D) Learning Outcomes Payloads

export interface MicroCheckAnsweredPayload {
  correct: boolean;
  latencyMs: number;
  difficulty: string;
}

export interface SrsReviewDonePayload {
  itemId: string;
  correct: boolean;
  intervalDays: number;
}

export interface AssessmentCompletedPayload {
  assessmentId: string;
  attemptId: string;
  scorePercent: number;
  scoreRaw: number;
  totalQuestions: number;
}

// E) Interventions Payloads

export interface DecisionAppliedPayload {
  action: string;
  reason: string;
  channel: string;
}

export interface MissionAssignedPayload {
  missionId: string;
  type: string;
}

export interface MissionCompletedPayload {
  missionId: string;
  score: number;
}

// ============================================================================
// PAYLOAD TYPE MAP
// ============================================================================

export interface TelemetryPayloadMap {
  [TelemetryEventType.SESSION_STARTED]: SessionStartedPayload;
  [TelemetryEventType.SECTION_VIEWED]: SectionViewedPayload;
  [TelemetryEventType.SCROLL_PATTERN]: ScrollPatternPayload;
  [TelemetryEventType.CONTEXT_SWITCH]: ContextSwitchPayload;
  [TelemetryEventType.FLOW_STATE_DETECTED]: FlowStateDetectedPayload;
  [TelemetryEventType.TOOLBOX_OPENED]: ToolboxOpenedPayload;
  [TelemetryEventType.MENU_OPENED]: MenuOpenedPayload;
  [TelemetryEventType.ACTION_SHORTCUT_USED]: ActionShortcutUsedPayload;
  [TelemetryEventType.UNDO_REDO_USED]: UndoRedoUsedPayload;
  [TelemetryEventType.MICRO_CHECK_ANSWERED]: MicroCheckAnsweredPayload;
  [TelemetryEventType.SRS_REVIEW_DONE]: SrsReviewDonePayload;
  [TelemetryEventType.ASSESSMENT_COMPLETED]: AssessmentCompletedPayload;
  [TelemetryEventType.DECISION_APPLIED]: DecisionAppliedPayload;
  [TelemetryEventType.MISSION_ASSIGNED]: MissionAssignedPayload;
  [TelemetryEventType.MISSION_COMPLETED]: MissionCompletedPayload;
}
