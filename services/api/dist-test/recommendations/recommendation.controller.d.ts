import { RecommendationService } from "./recommendation.service";
export declare class RecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: RecommendationService);
    getRecommendations(userId: string): Promise<{
        continueReading: import("./recommendation.service").RecommendationContent[];
        recentReads: import("./recommendation.service").RecommendationContent[];
        popularInGroups: import("./recommendation.service").RecommendationContent[];
        similar: import("./recommendation.service").RecommendationContent[];
        trending: import("./recommendation.service").RecommendationContent[];
    }>;
}
