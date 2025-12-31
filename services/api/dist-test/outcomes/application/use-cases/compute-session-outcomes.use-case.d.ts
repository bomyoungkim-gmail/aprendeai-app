import { IOutcomesRepository } from "../../domain/outcomes.repository.interface";
import { SessionOutcome } from "../../domain/session-outcome.entity";
import { ISessionsRepository } from "../../../sessions/domain/sessions.repository.interface";
import { IContentRepository } from "../../../cornell/domain/content.repository.interface";
export declare class ComputeSessionOutcomesUseCase {
    private readonly sessionsRepository;
    private readonly contentRepository;
    private readonly outcomesRepository;
    constructor(sessionsRepository: ISessionsRepository, contentRepository: IContentRepository, outcomesRepository: IOutcomesRepository);
    execute(sessionId: string): Promise<SessionOutcome>;
    private calculateComprehension;
    private calculateProduction;
    private calculateFrustration;
    private estimateExpectedDuration;
    private calculateActualDuration;
}
