import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalStars: number;
  avatar_url: string | null;
}

@Injectable()
export class GameLeaderboardService {
  private readonly logger = new Logger(GameLeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get global leaderboard (top players by total stars)
   */
  async getGlobalLeaderboard(
    limit: number = 10,
  ): Promise<{ leaders: LeaderboardEntry[] }> {
    // Aggregate total stars per user
    const results: any[] = await (this.prisma.game_progress as any).groupBy({
      by: ["user_id"],
      _sum: {
        stars: true,
      },
      orderBy: {
        _sum: {
          stars: "desc",
        },
      },
      take: limit,
    });

    // Fetch user details
    const userIds = results.map((r) => r.user_id);
    const users = await this.prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatar_url: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaders: LeaderboardEntry[] = results
      .map((result: any, index: number) => {
        const user = userMap.get(result.user_id);
        if (!user) return null;

        return {
          rank: index + 1,
          userId: result.user_id,
          userName: (user as any).name,
          totalStars: result._sum.stars || 0,
          avatar_url: (user as any).avatar_url,
        };
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null);

    this.logger.log(`Fetched leaderboard with ${leaders.length} entries`);

    return { leaders };
  }

  /**
   * Get user's rank and nearby players
   */
  async getUserRank(userId: string): Promise<{
    userRank: number | null;
    totalStars: number;
    nearby: LeaderboardEntry[];
  }> {
    // Get user's total stars
    const userProgress: any = await (
      this.prisma.game_progress as any
    ).aggregate({
      where: { user_id: userId },
      _sum: { stars: true },
    });

    const totalStars = userProgress._sum.stars || 0;

    // Get all users with their total stars (for ranking)
    const allResults: any[] = await (this.prisma.game_progress as any).groupBy({
      by: ["user_id"],
      _sum: { stars: true },
      orderBy: { _sum: { stars: "desc" } },
    });

    // Find user's rank
    const userRank = allResults.findIndex((r) => r.user_id === userId) + 1;

    // Get nearby players (2 above, 2 below)
    const startIndex = Math.max(0, userRank - 3);
    const nearbyResults = allResults.slice(startIndex, startIndex + 5);

    const userIds = nearbyResults.map((r) => r.user_id);
    const users = await this.prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar_url: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const nearby: LeaderboardEntry[] = nearbyResults
      .map((result: any, index: number) => {
        const user = userMap.get(result.user_id);
        if (!user) return null;

        return {
          rank: startIndex + index + 1,
          userId: result.user_id,
          userName: (user as any).name,
          totalStars: result._sum.stars || 0,
          avatar_url: (user as any).avatar_url,
        };
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null);

    return {
      userRank: userRank || null,
      totalStars,
      nearby,
    };
  }
}
