import { LogEventUseCase } from "./application/use-cases/log-event.use-case";
import { IEventRepository } from "./domain/interfaces/event.repository.interface";
import { FamilyPolicySetEvent, CoSessionStartedEvent, CoSessionPhaseChangedEvent, EducatorInterventionChosenEvent, FamilyAlertRaisedEvent, CoSessionFinishedEvent } from "./schemas/event-schemas";
export declare class FamilyEventService {
    private readonly logEventUseCase;
    private readonly eventRepo;
    constructor(logEventUseCase: LogEventUseCase, eventRepo: IEventRepository);
    logPolicySet(sessionId: string, userId: string, event: FamilyPolicySetEvent): Promise<void>;
    logCoSessionStarted(sessionId: string, userId: string, event: CoSessionStartedEvent): Promise<void>;
    logCoSessionPhaseChanged(sessionId: string, userId: string, event: CoSessionPhaseChangedEvent): Promise<void>;
    logEducatorIntervention(sessionId: string, userId: string, event: EducatorInterventionChosenEvent): Promise<void>;
    logFamilyAlert(sessionId: string, userId: string, event: FamilyAlertRaisedEvent): Promise<void>;
    logCoSessionFinished(sessionId: string, userId: string, event: CoSessionFinishedEvent): Promise<void>;
    getSessionEvents(sessionId: string): Promise<import("./domain/interfaces/event.repository.interface").IDomainEvent[]>;
    getHouseholdEvents(householdId: string, limit?: number): Promise<import("./domain/interfaces/event.repository.interface").IDomainEvent[]>;
}
