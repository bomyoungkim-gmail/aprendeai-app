export interface IDomainEvent {
    id: string;
    type: string;
    sessionId?: string;
    userId?: string;
    payload: any;
    createdAt: Date;
}
export interface IEventRepository {
    persist(event: IDomainEvent): Promise<void>;
    getSessionEvents(sessionId: string, domain?: string): Promise<IDomainEvent[]>;
    getHouseholdEvents(householdId: string, limit?: number): Promise<IDomainEvent[]>;
    getClassroomEvents(classroomId: string, limit?: number): Promise<IDomainEvent[]>;
    getStudentEvents(learnerUserId: string, limit?: number): Promise<IDomainEvent[]>;
}
export declare const IEventRepository: unique symbol;
