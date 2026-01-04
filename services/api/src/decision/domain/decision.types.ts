/**
 * Decision Service Types
 * 
 * Defines the core contracts for the decision engine that determines
 * when and how to intervene in the learning process.
 */

import { DecisionChannel, DecisionReason } from '@prisma/client';

/**
 * Input signals for decision-making
 */
export interface DecisionSignals {
  /** Explicit user action (e.g., clicking help, asking for analogy) */
  explicitUserAction?: 
    | 'USER_ASKS_ANALOGY' 
    | 'CLICK_TIER2_HELP'
    | 'USER_EXPLICIT_ASK';
  
  /** Number of doubts marked in the last 90 seconds */
  doubtsInWindow: number;
  
  /** Number of consecutive checkpoint failures */
  checkpointFailures: number;
  
  /** Current flow state based on scroll/tab metrics */
  flowState: 'FLOW' | 'LOW_FLOW' | 'ERRATIC';
  
  /** Quality of post-session summary */
  summaryQuality: 'EMPTY' | 'SHORT' | 'OK';

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
  | 'NO_OP'                      // Stay invisible
  | 'ASK_PROMPT'                 // Micro-intervention with short prompt
  | 'ASSIGN_MISSION'             // Assign a transfer mission
  | 'CALL_AGENT'                 // Invoke LangGraph agent
  | 'GUIDED_SYNTHESIS'           // Request guided Cornell summary
  | 'CALL_AI_SERVICE_EXTRACT';   // Call AI service for metadata extraction

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
import { SuppressReason } from './decision.suppress';
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
    doubtThreshold?: number;      // Default: 3
    doubtWindowSeconds?: number;  // Default: 90
    checkpointFailThreshold?: number; // Default: 2
  };
}
