import { GetRecommendationsUseCase } from "./application/use-cases/get-recommendations.use-case";
export { RecommendationContent } from "./domain/interfaces/recommendation.repository.interface";
export declare class RecommendationService {
    private readonly getRecommendationsUseCase;
    constructor(getRecommendationsUseCase: GetRecommendationsUseCase);
    getRecommendations(userId: string): Promise<{
        continueReading: import("./domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        recentReads: import("./domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        popularInGroups: import("./domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        similar: import("./domain/interfaces/recommendation.repository.interface").RecommendationContent[];
        trending: import("./domain/interfaces/recommendation.repository.interface").RecommendationContent[];
    }>;
}
