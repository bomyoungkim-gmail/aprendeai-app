import { Injectable } from "@nestjs/common";
import { ComputeSessionOutcomesUseCase } from "./application/use-cases/compute-session-outcomes.use-case";

@Injectable()
export class OutcomesService {
  constructor(
    private readonly computeSessionOutcomesUseCase: ComputeSessionOutcomesUseCase,
  ) {}

  /**
   * Compute session outcomes when session finishes.
   */
  async computeSessionOutcomes(sessionId: string) {
    return this.computeSessionOutcomesUseCase.execute(sessionId);
  }
}
