import { IReviewRepository } from "../../domain/review.repository.interface";
import { IVocabRepository } from "../../../vocab/domain/vocab.repository.interface";
import { SrsService, AttemptResult } from "../../../srs/srs.service";
import { VocabDimension } from "@prisma/client";
export interface SubmitReviewInput {
    vocabId: string;
    dimension: VocabDimension;
    result: AttemptResult;
    sessionId?: string;
}
export declare class SubmitReviewUseCase {
    private readonly reviewRepository;
    private readonly vocabRepository;
    private readonly srsService;
    constructor(reviewRepository: IReviewRepository, vocabRepository: IVocabRepository, srsService: SrsService);
    execute(userId: string, input: SubmitReviewInput): Promise<import("../../../vocab/domain/vocabulary.entity").Vocabulary>;
}
