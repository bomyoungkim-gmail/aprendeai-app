/**
 * Decision Service Types
 *
 * Defines the core contracts for the decision engine that determines
 * when and how to intervene in the learning process.
 */

import { DecisionChannel, DecisionReason } from "@prisma/client";

/**
 * Input signals for decision-making
 */
export interface DecisionSignals {
  /** Explicit user action (e.g., clicking help, asking for analogy) */
  explicitUserAction?:
    | "USER_ASKS_ANALOGY"
    | "CLICK_TIER2_HELP"
    | "USER_EXPLICIT_ASK"
    | "USER_ASKS_SENTENCE_ANALYSIS"
    | "USER_ASKS_TIER2"
    | "USER_ASKS_MORPHOLOGY"
    | "USER_ASKS_BRIDGING"
    | "USER_ASKS_HIGH_ROAD";

  /** User chat text for intent detection */
  chatContext?: {
    text: string;
    hasSelection: boolean;
    selectedText?: string;
  };

  /** Number of doubts marked in the last 90 seconds */
  doubtsInWindow: number;

  /** Number of consecutive checkpoint failures */
  checkpointFailures: number;

  /** Current flow state based on scroll/tab metrics */
  flowState: "FLOW" | "LOW_FLOW" | "ERRATIC";

  /** Quality of post-session summary */
  summaryQuality: "EMPTY" | "SHORT" | "OK";

  /** Domain context for mastery/scaffolding */
  domain?: string;

  /** SCRIPT 08: Low mastery indicator for Productive Failure */
  lowMastery?: boolean;

  /** SCRIPT 08: Content has PF-compatible assets (quiz_post_json/checkpoints_json) */
  contentHasPFAssets?: boolean;
}

/**
 * Input for decision evaluation
 */
export interface DecisionInput {
  userId: string;
  sessionId: string;
  contentId: string;
  chunkId?: string;
  uiPolicyVersion: string;
  signals: DecisionSignals;
}

/**
 * Possible decision actions (aligned with Prisma enum)
 */
export type DecisionAction =
  | "NO_OP" // Stay invisible
  | "ASK_PROMPT" // Micro-intervention with short prompt
  | "ASSIGN_MISSION" // Assign a transfer mission
  | "CALL_AGENT" // Invoke LangGraph agent
  | "GUIDED_SYNTHESIS" // Request guided Cornell summary
  | "CALL_AI_SERVICE_EXTRACT"; // Call AI service for metadata extraction

/**
 * Output of decision evaluation (legacy)
 */
export interface DecisionOutput {
  action: DecisionAction;
  channel: DecisionChannel;
  reason: DecisionReason;
  payload?: any; // Mission ID, prompt text, rubric, etc.
}

/**
 * Suppression reasons for v2 logging
 * Re-exported from decision.suppress.ts for centralized management
 */
import { SuppressReason } from "./decision.suppress";
export { SuppressReason };

/**
 * Decision result v2 with suppression tracking
 */
export interface DecisionResultV2 {
  candidateAction: DecisionAction;
  finalAction: DecisionAction;
  suppressed: boolean;
  suppressReasons: SuppressReason[];
  channelBefore: DecisionChannel;
  channelAfter: DecisionChannel;
  payload?: any;
  policySnapshot?: any;
  budgetRemainingTokens?: number;
  cooldownUntil?: string; // ISO date string
}

/**
 * Policy configuration from institution/family
 */
export interface DecisionPolicy {
  transferEnabled: boolean;
  scaffoldingLevelDefault: number;
  fadingEnabled: boolean;
  llmBudgetDailyTokens: number;
  decisionPolicyJson?: {
    doubtThreshold?: number; // Default: 3
    doubtWindowSeconds?: number; // Default: 90
    checkpointFailThreshold?: number; // Default: 2
  };
}

/**
 * DecisionPolicyV1 - Typed structure for decision_policy_json
 *
 * Allows institutions/families to override decision thresholds
 * while maintaining centralized defaults from decision.constants.ts
 *
 * Phase 2: Policy Integration
 */
export interface DecisionPolicyV1 {
  // Existing multipliers
  maxInterventionsPer10Min?: number;
  doubtSensitivityMultiplier?: number;
  checkpointFrequencyMultiplier?: number;

  // NEW: Flow Detection Threshold Overrides
  flowThresholds?: {
    highFlow?: number; // Default: 0.7
    lowFlow?: number; // Default: 0.3
  };

  // NEW: Mastery Threshold Overrides
  masteryThresholds?: {
    fade?: number; // Default: 0.8 (L0)
    low?: number; // Default: 0.6 (L1)
    medium?: number; // Default: 0.4 (L2)
  };

  // NEW: Scaffolding Config Overrides
  scaffoldingConfig?: {
    consistencySessionsRequired?: number; // Default: 3
  };
}

/**
 * Zod schema for DecisionPolicyV1 validation
 */
import { z } from "zod";

export const DecisionPolicyV1Schema = z
  .object({
    // Existing multipliers
    maxInterventionsPer10Min: z.number().min(0).max(10).optional(),
    doubtSensitivityMultiplier: z.number().min(0).max(2).optional(),
    checkpointFrequencyMultiplier: z.number().min(0).max(2).optional(),

    // Flow thresholds (0.0 - 1.0)
    flowThresholds: z
      .object({
        highFlow: z.number().min(0).max(1).optional(),
        lowFlow: z.number().min(0).max(1).optional(),
      })
      .optional(),

    // Mastery thresholds (0.0 - 1.0)
    masteryThresholds: z
      .object({
        fade: z.number().min(0).max(1).optional(),
        low: z.number().min(0).max(1).optional(),
        medium: z.number().min(0).max(1).optional(),
      })
      .optional(),

    // Scaffolding config
    scaffoldingConfig: z
      .object({
        consistencySessionsRequired: z.number().int().min(1).max(10).optional(),
      })
      .optional(),
  })
  .strict();
