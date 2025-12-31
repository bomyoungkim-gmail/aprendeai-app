import { AnalyticsService } from "./analytics.service";
import { users } from "@prisma/client";
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getProgress(user: users): Promise<import("./dto/analytics.dto").ProgressStatsDto>;
    getVocabulary(user: users): Promise<any[]>;
    getHourlyPerformance(user: users, days?: string): Promise<{
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
    getQualityOverview(user: users, period?: string): Promise<{
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
