import { ReviewService } from "./review.service";
import { VocabAttemptDto, ReviewQueueQueryDto } from "./dto/review.dto";
export declare class ReviewController {
    private reviewService;
    constructor(reviewService: ReviewService);
    getQueue(req: any, query: ReviewQueueQueryDto): Promise<{
        vocab: import("../vocab/domain/vocabulary.entity").Vocabulary[];
        cues: any[];
        stats: {
            totalDue: number;
            cap: number;
            vocabCount: number;
            cuesCount: number;
        };
    }>;
    recordAttempt(req: any, dto: VocabAttemptDto): Promise<import("../vocab/domain/vocabulary.entity").Vocabulary>;
}
