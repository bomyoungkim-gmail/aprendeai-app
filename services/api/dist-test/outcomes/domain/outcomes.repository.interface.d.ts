import { SessionOutcome } from "./session-outcome.entity";
export interface IOutcomesRepository {
    upsert(outcome: SessionOutcome): Promise<SessionOutcome>;
    findBySessionId(sessionId: string): Promise<SessionOutcome | null>;
}
export declare const IOutcomesRepository: unique symbol;
