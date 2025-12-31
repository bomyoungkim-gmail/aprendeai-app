import { ComputeSessionOutcomesUseCase } from "./application/use-cases/compute-session-outcomes.use-case";
export declare class OutcomesService {
    private readonly computeSessionOutcomesUseCase;
    constructor(computeSessionOutcomesUseCase: ComputeSessionOutcomesUseCase);
    computeSessionOutcomes(sessionId: string): Promise<import("./domain/session-outcome.entity").SessionOutcome>;
}
