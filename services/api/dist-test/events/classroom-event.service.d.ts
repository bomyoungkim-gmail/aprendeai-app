import { LogEventUseCase } from "./application/use-cases/log-event.use-case";
import { IEventRepository } from "./domain/interfaces/event.repository.interface";
import { ClassPolicySetEvent, ClassWeeklyPlanCreatedEvent, ClassAlertRaisedEvent } from "./schemas/event-schemas";
export declare class ClassroomEventService {
    private readonly logEventUseCase;
    private readonly eventRepo;
    constructor(logEventUseCase: LogEventUseCase, eventRepo: IEventRepository);
    logPolicySet(sessionId: string, userId: string, event: ClassPolicySetEvent): Promise<void>;
    logWeeklyPlanCreated(sessionId: string, userId: string, event: ClassWeeklyPlanCreatedEvent): Promise<void>;
    logClassAlert(sessionId: string, userId: string, event: ClassAlertRaisedEvent): Promise<void>;
    getClassroomEvents(classroomId: string, limit?: number): Promise<import("./domain/interfaces/event.repository.interface").IDomainEvent[]>;
    getStudentEvents(learnerUserId: string, limit?: number): Promise<import("./domain/interfaces/event.repository.interface").IDomainEvent[]>;
}
