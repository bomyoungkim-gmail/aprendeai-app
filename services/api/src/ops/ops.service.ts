import { Injectable } from "@nestjs/common";
import { OpsCoachService } from "../family/services/ops-coach.service";
import { GetDailySnapshotUseCase } from "./application/use-cases/get-daily-snapshot.use-case";
import { GetTaskQueueUseCase } from "./application/use-cases/get-task-queue.use-case";
import { GetContextCardsUseCase } from "./application/use-cases/get-context-cards.use-case";
import { LogStudyTimeUseCase } from "./application/use-cases/log-study-time.use-case";
import { LogTimeDto } from "./dto/ops.dto";

@Injectable()
export class OpsService {
  constructor(
    private readonly getDailySnapshotUseCase: GetDailySnapshotUseCase,
    private readonly getTaskQueueUseCase: GetTaskQueueUseCase,
    private readonly getContextCardsUseCase: GetContextCardsUseCase,
    private readonly logStudyTimeUseCase: LogStudyTimeUseCase,
    private readonly opsCoach: OpsCoachService,
  ) {}

  /**
   * Get comprehensive daily snapshot
   */
  async getDailySnapshot(userId: string) {
    return this.getDailySnapshotUseCase.execute(userId);
  }

  /**
   * Get prioritized next tasks
   */
  async getWhatsNext(userId: string) {
    return this.getTaskQueueUseCase.execute(userId);
  }

  /**
   * Get context cards
   */
  async getContextCards(userId: string) {
    return this.getContextCardsUseCase.execute(userId);
  }

  /**
   * Log study time
   */
  async logTime(userId: string, dto: LogTimeDto) {
    return this.logStudyTimeUseCase.execute(userId, dto.minutes);
  }

  /**
   * Get boot prompt
   */
  async getBootPrompt(userId: string) {
    return this.opsCoach.getDailyBootLearner();
  }

  /**
   * Get close prompt
   */
  async getClosePrompt(userId: string) {
    return this.opsCoach.getDailyCloseLearner();
  }
}
