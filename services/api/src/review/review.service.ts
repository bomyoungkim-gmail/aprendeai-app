import { Injectable } from "@nestjs/common";
import { GetReviewQueueUseCase } from "./application/use-cases/get-review-queue.use-case";
import { SubmitReviewUseCase } from "./application/use-cases/submit-review.use-case";
import { AttemptResult } from "../srs/srs.service";
import { VocabDimension } from "@prisma/client";

@Injectable()
export class ReviewService {
  constructor(
    private readonly getReviewQueueUseCase: GetReviewQueueUseCase,
    private readonly submitReviewUseCase: SubmitReviewUseCase,
  ) {}

  /**
   * Get review queue for user
   */
  async getReviewQueue(userId: string, limit?: number) {
    return this.getReviewQueueUseCase.execute(userId, limit);
  }

  /**
   * Record vocab attempt and update SRS
   */
  async recordVocabAttempt(
    userId: string,
    vocabId: string,
    dimension: VocabDimension,
    result: AttemptResult,
    sessionId?: string,
  ) {
    return this.submitReviewUseCase.execute(userId, {
        vocabId,
        dimension,
        result,
        sessionId
    });
  }

  /**
   * Get cue cards from Cornell Notes
   */
  async getCueCards(userId: string) {
    return [];
  }
}
