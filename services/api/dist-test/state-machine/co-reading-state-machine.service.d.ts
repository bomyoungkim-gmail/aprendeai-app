import { FamilyEventService } from "../events/family-event.service";
import { CoReadingPhase, CoReadingContext, PhaseTransitionResult } from "./types";
export declare class CoReadingStateMachine {
    private familyEventService;
    private readonly logger;
    private readonly PRE_TIMEOUT_MS;
    constructor(familyEventService: FamilyEventService);
    private canTransition;
    transition(context: CoReadingContext, targetPhase: CoReadingPhase): Promise<PhaseTransitionResult>;
    private getNextPromptKey;
    hasPreTimedOut(context: CoReadingContext): boolean;
    hasDuringTimedOut(context: CoReadingContext): boolean;
    handleCheckpointFail(context: CoReadingContext): Promise<{
        shouldIntervene: boolean;
        count: number;
    }>;
    boot(context: CoReadingContext): Promise<PhaseTransitionResult>;
    pre(context: CoReadingContext): Promise<PhaseTransitionResult>;
    during(context: CoReadingContext): Promise<PhaseTransitionResult>;
    post(context: CoReadingContext): Promise<PhaseTransitionResult>;
    close(context: CoReadingContext): Promise<PhaseTransitionResult>;
}
