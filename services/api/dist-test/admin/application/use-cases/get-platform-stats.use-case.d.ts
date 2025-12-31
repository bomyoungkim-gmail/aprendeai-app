import { PrismaService } from "../../../prisma/prisma.service";
export declare class GetPlatformStatsUseCase {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute(): Promise<{
        totalUsers: number;
        totalInstitutions: number;
        totalFamilies: number;
        totalContent: number;
        activeUsersThisWeek: number;
        newUsersThisMonth: number;
    }>;
}
