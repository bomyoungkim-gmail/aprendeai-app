import { IAnalyticsRepository } from "./domain/analytics.repository.interface";
import { ProgressStatsDto } from "./dto/analytics.dto";
import { GetStudentProgressUseCase } from "./application/use-cases/get-student-progress.use-case";
import { GetHourlyPerformanceUseCase } from "./application/use-cases/get-hourly-performance.use-case";
import { GetQualityOverviewUseCase } from "./application/use-cases/get-quality-overview.use-case";
export declare class AnalyticsService {
    private readonly repository;
    private readonly getProgressUseCase;
    private readonly getHourlyPerformanceUseCase;
    private readonly getQualityOverviewUseCase;
    constructor(repository: IAnalyticsRepository, getProgressUseCase: GetStudentProgressUseCase, getHourlyPerformanceUseCase: GetHourlyPerformanceUseCase, getQualityOverviewUseCase: GetQualityOverviewUseCase);
    getStudentProgress(userId: string): Promise<ProgressStatsDto>;
    getVocabularyList(userId: string): Promise<any[]>;
    getHourlyPerformance(userId: string, days?: number): Promise<{
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
    getQualityOverview(userId: string, period?: string): Promise<{
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
