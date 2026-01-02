import { Injectable, Inject } from "@nestjs/common";
import { IRecommendationRepository } from "../../domain/interfaces/recommendation.repository.interface";
import { ISessionsRepository } from "../../../sessions/domain/sessions.repository.interface";
import { IStudyGroupsRepository } from "../../../study-groups/domain/study-groups.repository.interface";

@Injectable()
export class GetRecommendationsUseCase {
  constructor(
    @Inject(IRecommendationRepository)
    private readonly recommendationRepo: IRecommendationRepository,
    @Inject(ISessionsRepository)
    private readonly sessionsRepository: ISessionsRepository,
    @Inject(IStudyGroupsRepository)
    private readonly studyGroupsRepository: IStudyGroupsRepository,
  ) {}

  async execute(userId: string) {
    // 1. Get user's active groups
    const activeGroups = await this.studyGroupsRepository.findByUser(userId);
    const groupIds = activeGroups.map((g) => g.id);

    // 2. Get user's recent content preferences
    const recentSessions = await this.sessionsRepository.findMany({
      where: { user_id: userId },
      orderBy: { started_at: "desc" }, // Currently passing Prisma sort obj directly
      take: 5,
    });

    const types = [
      ...new Set(
        recentSessions.map((s) => s.content?.type).filter(Boolean) as string[],
      ),
    ];
    const languages = [
      ...new Set(
        recentSessions
          .map((s) => s.content?.originalLanguage)
          .filter(Boolean) as string[],
      ),
    ];

    // 3. Get content IDs user has already read
    const readIds = await this.sessionsRepository.findReadContentIds(userId);

    // 4. Fetch categorization in parallel
    const [continueReading, recentReads, popularInGroups, similar, trending] =
      await Promise.all([
        this.recommendationRepo.getContinueReading(userId),
        this.recommendationRepo.getRecentReads(userId),
        this.recommendationRepo.getPopularInGroups(userId, groupIds),
        this.recommendationRepo.getSimilarContent(
          userId,
          types,
          languages,
          readIds,
        ),
        this.recommendationRepo.getTrending(userId, readIds),
      ]);

    return {
      continueReading,
      recentReads,
      popularInGroups,
      similar,
      trending,
    };
  }
}
