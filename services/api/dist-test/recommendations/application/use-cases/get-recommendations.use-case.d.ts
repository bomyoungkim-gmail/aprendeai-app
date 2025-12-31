import { IRecommendationRepository } from '../../domain/interfaces/recommendation.repository.interface';
import { ISessionsRepository } from '../../../sessions/domain/sessions.repository.interface';
import { IStudyGroupsRepository } from '../../../study-groups/domain/study-groups.repository.interface';
export declare class GetRecommendationsUseCase {
    private readonly recommendationRepo;
    private readonly sessionsRepository;
    private readonly studyGroupsRepository;
    constructor(recommendationRepo: IRecommendationRepository, sessionsRepository: ISessionsRepository, studyGroupsRepository: IStudyGroupsRepository);
    execute(userId: string): Promise<{
        continueReading: import("../../domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        recentReads: import("../../domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        popularInGroups: import("../../domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        similar: import("../../domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        trending: import("../../domain/interfaces/recommendation.repository.interface").RecommendationContent[];
    }>;
}
