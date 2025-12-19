// WebSocket event types for Study Groups
export enum StudyGroupEvent {
  // Session events
  SESSION_CREATED = 'session.created',
  SESSION_STARTED = 'session.started',
  SESSION_ENDED = 'session.ended',
  SESSION_UPDATED = 'session.updated',
  
  // Round events
  ROUND_ADVANCED = 'round.advanced',
  ROUND_UPDATED = 'round.updated',
  PROMPT_UPDATED = 'prompt.updated',
  
  // Member events
  MEMBER_JOINED = 'member.joined',
  MEMBER_LEFT = 'member.left',
  
  // Activity events
  VOTE_SUBMITTED = 'vote.submitted',
  REVOTE_SUBMITTED = 'revote.submitted',
  EXPLANATION_SUBMITTED = 'explanation.submitted',
  SHARED_CARD_CREATED = 'sharedCard.created',
  
  // Chat events
  CHAT_MESSAGE = 'chat.message',
  
  // User presence
  USER_JOINED = 'user.joined',
  USER_LEFT = 'user.left',
}

export interface WebSocketEventPayload {
  sessionId: string;
  roundId?: string;
  roundIndex?: number;
  userId?: string;
  data?: any;
  timestamp: string;
}
