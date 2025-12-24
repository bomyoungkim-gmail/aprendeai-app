import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalStars: number;
  avatarUrl: string | null;
}

@Injectable()
export class GameLeaderboardService {
  private readonly logger = new Logger(GameLeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get global leaderboard (top players by total stars)
   */
  async getGlobalLeaderboard(limit: number = 10): Promise<{ leaders: LeaderboardEntry[] }> {
    // Aggregate total stars per user
    const results = await this.prisma.gameProgress.groupBy({
      by: ['userId'],
      _sum: {
        stars: true,
      },
      orderBy: {
        _sum: {
          stars: 'desc',
        },
      },
      take: limit,
    });

    // Fetch user details
    const userIds = results.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine and add ranks
    const leaders: LeaderboardEntry[] = results
      .map((result, index) => {
        const user = userMap.get(result.userId);
        if (!user) return null;

        return {
          rank: index + 1,
          userId: result.userId,
          userName: user.name,
          totalStars: result._sum.stars || 0,
          avatarUrl: user.avatarUrl,
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
    const userProgress = await this.prisma.gameProgress.aggregate({
      where: { userId },
      _sum: { stars: true },
    });

    const totalStars = userProgress._sum.stars || 0;

    // Get all users with their total stars (for ranking)
    const allResults = await this.prisma.gameProgress.groupBy({
      by: ['userId'],
      _sum: { stars: true },
      orderBy: { _sum: { stars: 'desc' } },
    });

    // Find user's rank
    const userRank = allResults.findIndex(r => r.userId === userId) + 1;

    // Get nearby players (2 above, 2 below)
    const startIndex = Math.max(0, userRank - 3);
    const nearbyResults = allResults.slice(startIndex, startIndex + 5);

    const userIds = nearbyResults.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const nearby: LeaderboardEntry[] = nearbyResults
      .map((result, index) => {
        const user = userMap.get(result.userId);
        if (!user) return null;

        return {
          rank: startIndex + index + 1,
          userId: result.userId,
          userName: user.name,
          totalStars: result._sum.stars || 0,
          avatarUrl: user.avatarUrl,
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
