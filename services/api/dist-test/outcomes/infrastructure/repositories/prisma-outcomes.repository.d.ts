import { PrismaService } from "../../../prisma/prisma.service";
import { IOutcomesRepository } from "../../domain/outcomes.repository.interface";
import { SessionOutcome } from "../../domain/session-outcome.entity";
export declare class PrismaOutcomesRepository implements IOutcomesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(outcome: SessionOutcome): Promise<SessionOutcome>;
    findBySessionId(sessionId: string): Promise<SessionOutcome | null>;
    private mapToDomain;
}
