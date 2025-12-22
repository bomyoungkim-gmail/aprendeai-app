/**
 * Type definitions for Reading Sessions
 * Phase 3: Prompt-only interface types
 */

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
}

/**
 * Finish session request
 */
export interface FinishSessionDto {
  reason: 'USER_FINISHED' | 'USER_ABANDONED' | 'ERROR' | 'TIMEOUT';
}
