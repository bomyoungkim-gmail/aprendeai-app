import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Content Mode Analytics Service (Script 02 Enhancement)
 * Tracks and analyzes content mode distribution and usage patterns
 */
@Injectable()
export class ContentModeAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get mode distribution for user's content
   * Returns count by mode and mode source
   */
  async getModeDistribution(userId: string) {
    // Get all content created by or accessible to user
    const modeDistribution = await this.prisma.contents.groupBy({
      by: ["mode", "mode_source"],
      where: {
        OR: [{ created_by: userId }, { owner_user_id: userId }],
        mode: { not: null }, // Only count content with assigned mode
      },
      _count: {
        mode: true,
      },
    });

    // Transform to more readable format
    const byMode = {};
    const bySource = {};
    let total = 0;

    for (const item of modeDistribution) {
      const mode = item.mode || "UNKNOWN";
      const source = item.mode_source || "UNKNOWN";
      const count = item._count.mode;

      // Count by mode
      byMode[mode] = (byMode[mode] || 0) + count;

      // Count by source
      bySource[source] = (bySource[source] || 0) + count;

      total += count;
    }

    return {
      total,
      byMode,
      bySource,
      details: modeDistribution.map((item) => ({
        mode: item.mode,
        source: item.mode_source,
        count: item._count.mode,
      })),
    };
  }

  /**
   * Get global mode distribution (admin only)
   */
  async getGlobalModeDistribution() {
    const modeDistribution = await this.prisma.contents.groupBy({
      by: ["mode"],
      where: {
        mode: { not: null },
      },
      _count: {
        mode: true,
      },
    });

    return modeDistribution.map((item) => ({
      mode: item.mode,
      count: item._count.mode,
    }));
  }

  /**
   * Get mode source distribution (HEURISTIC vs USER vs PRODUCER)
   */
  async getModeSourceDistribution(userId?: string) {
    const where = userId
      ? {
          OR: [{ created_by: userId }, { owner_user_id: userId }],
          mode_source: { not: null },
        }
      : { mode_source: { not: null } };

    const sourceDistribution = await this.prisma.contents.groupBy({
      by: ["mode_source"],
      where,
      _count: {
        mode_source: true,
      },
    });

    return sourceDistribution.map((item) => ({
      source: item.mode_source,
      count: item._count.mode_source,
    }));
  }
}
