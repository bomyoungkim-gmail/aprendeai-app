import { SessionOutcome } from "./session-outcome.entity";

export interface IOutcomesRepository {
  upsert(outcome: SessionOutcome): Promise<SessionOutcome>;
  findBySessionId(sessionId: string): Promise<SessionOutcome | null>;
}

export const IOutcomesRepository = Symbol("IOutcomesRepository");
