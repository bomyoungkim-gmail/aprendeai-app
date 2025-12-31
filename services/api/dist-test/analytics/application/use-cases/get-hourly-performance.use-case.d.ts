import { IAnalyticsRepository } from '../../domain/analytics.repository.interface';
export declare class GetHourlyPerformanceUseCase {
    private readonly repository;
    constructor(repository: IAnalyticsRepository);
    execute(userId: string, days?: number): Promise<{
        hourlyBreakdown: {
            hour: any;
            avgAccuracy: any;
            avgFocusScore: any;
            sessionCount: number;
            totalMinutes: number;
        }[];
        peakHours: any[];
        daysAnalyzed: number;
    }>;
}
