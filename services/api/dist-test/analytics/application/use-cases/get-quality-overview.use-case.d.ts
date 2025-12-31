import { IAnalyticsRepository } from '../../domain/analytics.repository.interface';
export declare class GetQualityOverviewUseCase {
    private readonly repository;
    constructor(repository: IAnalyticsRepository);
    execute(userId: string, period?: string): Promise<{
        period: number;
        totalSessions: number;
        avgAccuracy: number;
        avgFocusScore?: undefined;
    } | {
        period: number;
        totalSessions: number;
        avgAccuracy: number;
        avgFocusScore: number;
    }>;
}
