export declare enum StudyGroupEvent {
    SESSION_CREATED = "session.created",
    SESSION_STARTED = "session.started",
    SESSION_ENDED = "session.ended",
    SESSION_UPDATED = "session.updated",
    ROUND_ADVANCED = "round.advanced",
    ROUND_UPDATED = "round.updated",
    PROMPT_UPDATED = "prompt.updated",
    MEMBER_JOINED = "member.joined",
    MEMBER_LEFT = "member.left",
    VOTE_SUBMITTED = "vote.submitted",
    REVOTE_SUBMITTED = "revote.submitted",
    EXPLANATION_SUBMITTED = "explanation.submitted",
    SHARED_CARD_CREATED = "sharedCard.created",
    CHAT_MESSAGE = "chat.message",
    USER_JOINED = "user.joined",
    USER_LEFT = "user.left"
}
export interface WebSocketEventPayload {
    sessionId: string;
    roundId?: string;
    roundIndex?: number;
    userId?: string;
    data?: any;
    timestamp: string;
}
