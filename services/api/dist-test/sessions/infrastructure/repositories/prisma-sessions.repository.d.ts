import { PrismaService } from "../../../prisma/prisma.service";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession, SessionEvent } from "../../domain/reading-session.entity";
export declare class PrismaSessionsRepository implements ISessionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Partial<ReadingSession>): Promise<ReadingSession>;
    findById(id: string): Promise<ReadingSession | null>;
    update(id: string, data: Partial<ReadingSession>): Promise<ReadingSession>;
    addEvent(sessionId: string, event: Partial<SessionEvent>): Promise<SessionEvent>;
    findEvents(sessionId: string): Promise<SessionEvent[]>;
    findMany(params: any): Promise<ReadingSession[]>;
    count(params: any): Promise<number>;
    findReadContentIds(userId: string): Promise<string[]>;
    private mapToDomain;
}
