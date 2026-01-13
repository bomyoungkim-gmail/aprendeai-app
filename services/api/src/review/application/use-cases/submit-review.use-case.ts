import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IReviewRepository } from "../../domain/review.repository.interface";
import { IVocabRepository } from "../../../vocab/domain/vocab.repository.interface";
import { SrsService, AttemptResult } from "../../../srs/srs.service";
import { VocabAttempt } from "../../domain/vocab-attempt.entity";
import { VocabDimension, SrsStage } from "@prisma/client";
import { TelemetryService } from "../../../telemetry/telemetry.service";
import { TelemetryEventType } from "../../../telemetry/domain/telemetry.constants";
import { v4 as uuidv4 } from "uuid";

export interface SubmitReviewInput {
  vocabId: string;
  dimension: VocabDimension;
  result: AttemptResult;
  sessionId?: string;
}

@Injectable()
export class SubmitReviewUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
    @Inject(IVocabRepository)
    private readonly vocabRepository: IVocabRepository,
    private readonly srsService: SrsService,
    private readonly telemetryService: TelemetryService,
  ) {}

  async execute(userId: string, input: SubmitReviewInput) {
    const vocab = await this.vocabRepository.findById(input.vocabId);
    if (!vocab) {
      throw new NotFoundException(`Vocabulary item ${input.vocabId} not found`);
    }

    if (vocab.userId !== userId) {
      // Simple ownership check
      throw new NotFoundException(`Vocabulary item not found or access denied`);
    }

    // Calculate SRS
    const calc = this.srsService.calculateNextDue(
      vocab.srsStage as any,
      input.result,
    );
    const masteryDelta = this.srsService.calculateMasteryDelta(input.result);

    // Prepare objects
    const attempt = new VocabAttempt({
      id: uuidv4(),
      vocabId: vocab.id,
      sessionId: input.sessionId,
      dimension: input.dimension,
      result: input.result,
      createdAt: new Date(),
    });

    // Delegate to Repo for Transactional Update
    const updatedVocab =
      await this.reviewRepository.recordAttemptAndUpdateVocab(attempt, {
        id: vocab.id,
        srsStage: calc.newStage as SrsStage,
        dueAt: calc.dueDate,
        lapsesIncrement: calc.lapseIncrement,
        masteryDelta,
      });

    // Emit telemetry for SRS review
    await this.telemetryService.track(
      {
        eventType: TelemetryEventType.SRS_REVIEW_DONE,
        eventVersion: "1.0.0",
        contentId: vocab.contentId || "unknown",
        sessionId: input.sessionId || "unknown",
        data: {
          itemId: vocab.id,
          correct: input.result === "OK" || input.result === "EASY",
          intervalDays: Math.floor(
            (calc.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        },
      },
      userId,
    );

    return updatedVocab;
  }
}
