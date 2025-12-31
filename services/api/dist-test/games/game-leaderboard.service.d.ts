import { PrismaService } from "../prisma/prisma.service";
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    totalStars: number;
    avatar_url: string | null;
}
export declare class GameLeaderboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getGlobalLeaderboard(limit?: number): Promise<{
        leaders: LeaderboardEntry[];
    }>;
    getUserRank(userId: string): Promise<{
        userRank: number | null;
        totalStars: number;
        nearby: LeaderboardEntry[];
    }>;
}
