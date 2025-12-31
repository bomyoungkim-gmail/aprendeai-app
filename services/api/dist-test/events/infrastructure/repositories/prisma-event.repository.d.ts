import { PrismaService } from '../../../prisma/prisma.service';
import { IEventRepository, IDomainEvent } from '../../domain/interfaces/event.repository.interface';
export declare class PrismaEventRepository implements IEventRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    persist(event: IDomainEvent): Promise<void>;
    getSessionEvents(sessionId: string, domain?: string): Promise<IDomainEvent[]>;
    getHouseholdEvents(householdId: string, limit?: number): Promise<IDomainEvent[]>;
    getClassroomEvents(classroomId: string, limit?: number): Promise<IDomainEvent[]>;
    getStudentEvents(learnerUserId: string, limit?: number): Promise<IDomainEvent[]>;
    private mapToEntity;
}
