export declare enum CoReadingPhase {
    BOOT = "BOOT",
    PRE = "PRE",
    DURING = "DURING",
    POST = "POST",
    CLOSE = "CLOSE"
}
export interface CoReadingContext {
    coSessionId: string;
    householdId: string;
    learnerUserId: string;
    educatorUserId: string;
    readingSessionId: string;
    currentPhase: CoReadingPhase;
    timeboxMin: number;
    checkpointFailCount: number;
    startedAt: Date;
    phaseStartedAt: Date;
}
export interface PhaseTransitionResult {
    success: boolean;
    newPhase: CoReadingPhase;
    message?: string;
    nextPromptKey?: string;
}
