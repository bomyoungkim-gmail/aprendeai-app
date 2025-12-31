import { PrismaService } from "../../prisma/prisma.service";
import { FamilyPrivacyGuard } from "../../privacy/family-privacy-guard.service";
import { EducatorDashboardData } from "../../privacy/types";
export declare class FamilyDashboardService {
    private prisma;
    private privacyGuard;
    constructor(prisma: PrismaService, privacyGuard: FamilyPrivacyGuard);
    getEducatorDashboard(family_id: string, learner_user_id: string): Promise<EducatorDashboardData>;
    private calculateStats;
    private calculateStreak;
    private calculateTrend;
    private getTopBlockers;
    private getAlerts;
    getWeeklySummary(family_id: string, learner_user_id: string): Promise<{
        weekStart: string;
        sessionCount: number;
        minutesTotal: number;
        comprehensionAvg: number;
        topBlockers: string[];
        actions: string[];
    }>;
}
