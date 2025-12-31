import { PrismaService } from "../prisma/prisma.service";
export interface PlanLimits {
    highlightsPerMonth: number;
    cornellNotesPerMonth: number;
    contentsPerMonth: number;
}
export declare class PlanLimitsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly PLAN_LIMITS;
    getUserLimits(userId: string): Promise<PlanLimits>;
    checkQuota(userId: string, metric: string): Promise<boolean>;
    private getUsageCount;
    getRemainingQuota(userId: string, metric: string): Promise<number>;
}
