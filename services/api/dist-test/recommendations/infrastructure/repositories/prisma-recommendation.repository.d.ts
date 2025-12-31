import { PrismaService } from '../../../prisma/prisma.service';
import { IRecommendationRepository, RecommendationContent } from '../../domain/interfaces/recommendation.repository.interface';
export declare class PrismaRecommendationRepository implements IRecommendationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getContinueReading(userId: string): Promise<RecommendationContent[]>;
    getRecentReads(userId: string): Promise<RecommendationContent[]>;
    getPopularInGroups(userId: string, groupIds: string[]): Promise<RecommendationContent[]>;
    getSimilarContent(userId: string, types: string[], languages: string[], readIds: string[]): Promise<RecommendationContent[]>;
    getTrending(userId: string, readIds: string[]): Promise<RecommendationContent[]>;
    private calculateProgress;
    private calculatePopularityScore;
}
