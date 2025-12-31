import { IReviewRepository } from "../../domain/review.repository.interface";
import { ProfileService } from "../../../profiles/profile.service";
export declare class GetReviewQueueUseCase {
    private readonly reviewRepository;
    private readonly profileService;
    constructor(reviewRepository: IReviewRepository, profileService: ProfileService);
    execute(userId: string, limit?: number): Promise<{
        vocab: import("../../../vocab/domain/vocabulary.entity").Vocabulary[];
        cues: any[];
        stats: {
            totalDue: number;
            cap: number;
            vocabCount: number;
            cuesCount: number;
        };
    }>;
}
