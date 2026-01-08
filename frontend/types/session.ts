/**
 * Type definitions for Reading Sessions
 * Phase 3: Prompt-only interface types
 */

/**
 * Decision Policy V1 Schema
 * Matches backend DecisionPolicyV1 from services/api/src/policies/decision-policy.schema.ts
 */
export interface DecisionPolicyV1 {
  version: 1;
  features: {
    transferGraphEnabled: boolean;
    sentenceAnalysisEnabled: boolean;
    pkmEnabled: boolean;
    gamesEnabled: boolean;
    missionFeedbackEnabled: boolean;
    huggingEnabled: boolean;
  };
  extraction: {
    allowTextExtraction: boolean;
    allowOcr: boolean;
  };
  scaffolding: {
    thresholds: {
      masteryHigh: number;
      masteryLow: number;
      frustrationHigh: number;
    };
    adaptiveScaffolding: boolean;
  };
  budgeting: {
    strategy: 'DETERMINISTIC_FIRST' | 'LLM_FIRST' | 'HYBRID';
    maxLlmCallsPerSession: number;
  };
  limits: {
    maxSelectedTextChars: number;
  };
}

/**
 * Chat message in prompt console
 */
export interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

/**
 * Prompt message DTO (matches NestJS)
 */
export interface PromptMessageDto {
  threadId: string;
  readingSessionId: string;
  actorRole: 'LEARNER' | 'EDUCATOR';
  text: string;
  clientTs: string;
  metadata: {
    uiMode: 'PRE' | 'DURING' | 'POST' | 'PLAN';
    contentId: string;
    assetLayer: 'L1' | 'L2' | 'L3';
    readingIntent: 'inspectional' | 'analytical' | 'syntopical';
    blockId?: string;
    chunkId?: string;
    page?: number;
    span?: { start: number; end: number };
  };
}

/**
 * Agent turn response (matches NestJS)
 */
export interface AgentTurnResponse {
  threadId: string;
  readingSessionId: string;
  nextPrompt: string;
  quickReplies: string[];
  eventsToWrite?: any[];
  hilRequest?: any;
}

/**
 * Start session request
 */
export interface StartSessionDto {
  contentId: string;
  assetLayer: 'L1' | 'L2' | 'L3';
  readingIntent?: 'inspectional' | 'analytical' | 'syntopical';
}

/**
 * Start session response
 */
export interface StartSessionResponse {
  readingSessionId: string;
  threadId: string;
  phase: 'PRE' | 'DURING' | 'POST';
  nextPrompt: string;
  quickReplies: string[];
  decision_policy?: DecisionPolicyV1; // Policy for this session
}

/**
 * Finish session request
 */
export interface FinishSessionDto {
  reason: 'USER_FINISHED' | 'USER_ABANDONED' | 'ERROR' | 'TIMEOUT';
}

/**
 * Reading session data (extended)
 */
export interface ReadingSession {
  id: string;
  userId: string;
  contentId: string;
  threadId?: string;
  phase: 'PRE' | 'DURING' | 'POST';
  startedAt: Date;
  finishedAt?: Date;
  decision_policy?: DecisionPolicyV1; // Policy for this session
}
