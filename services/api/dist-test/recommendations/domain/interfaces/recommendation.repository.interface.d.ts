export interface RecommendationContent {
    id: string;
    title: string;
    type: string;
    original_language: string;
    created_at: Date;
    users_owner?: {
        id: string;
        name: string;
    };
    progress?: number;
    popularity?: number;
}
export interface IRecommendationRepository {
    getContinueReading(userId: string): Promise<RecommendationContent[]>;
    getRecentReads(userId: string): Promise<RecommendationContent[]>;
    getPopularInGroups(userId: string, groupIds: string[]): Promise<RecommendationContent[]>;
    getSimilarContent(userId: string, types: string[], languages: string[], readIds: string[]): Promise<RecommendationContent[]>;
    getTrending(userId: string, readIds: string[]): Promise<RecommendationContent[]>;
}
export declare const IRecommendationRepository: unique symbol;
