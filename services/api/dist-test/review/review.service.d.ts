import { GetReviewQueueUseCase } from "./application/use-cases/get-review-queue.use-case";
import { SubmitReviewUseCase } from "./application/use-cases/submit-review.use-case";
import { AttemptResult } from "../srs/srs.service";
import { VocabDimension } from "@prisma/client";
export declare class ReviewService {
    private readonly getReviewQueueUseCase;
    private readonly submitReviewUseCase;
    constructor(getReviewQueueUseCase: GetReviewQueueUseCase, submitReviewUseCase: SubmitReviewUseCase);
    getReviewQueue(userId: string, limit?: number): Promise<{
        vocab: import("../vocab/domain/vocabulary.entity").Vocabulary[];
        cues: any[];
        stats: {
            totalDue: number;
            cap: number;
            vocabCount: number;
            cuesCount: number;
        };
    }>;
    recordVocabAttempt(userId: string, vocabId: string, dimension: VocabDimension, result: AttemptResult, sessionId?: string): Promise<import("../vocab/domain/vocabulary.entity").Vocabulary>;
    getCueCards(userId: string): Promise<any[]>;
}
