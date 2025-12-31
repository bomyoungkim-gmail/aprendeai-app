import { Injectable, Inject } from "@nestjs/common";
import { IReviewRepository } from "../../domain/review.repository.interface";
import { ProfileService } from "../../../profiles/profile.service";

@Injectable()
export class GetReviewQueueUseCase {
  constructor(
    @Inject(IReviewRepository) private readonly reviewRepository: IReviewRepository,
    private readonly profileService: ProfileService,
  ) {}

  async execute(userId: string, limit?: number) {
    // 1. Determine cap
    let cap = limit;
    if (!cap) {
        const profile = await this.profileService.get(userId);
        cap = profile?.dailyReviewCap || 20;
    }

    // 2. Fetch Review Items (Vocab)
    const vocab = await this.reviewRepository.findDue(userId, cap);
    const totalDue = await this.reviewRepository.countDue(userId);

    // 3. Stats & Result
    return {
      vocab,
      cues: [], // Deferred V5
      stats: {
        totalDue,
        cap,
        vocabCount: vocab.length,
        cuesCount: 0,
      },
    };
  }
}
