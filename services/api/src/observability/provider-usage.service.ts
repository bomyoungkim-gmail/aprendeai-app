import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProviderUsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Track external provider usage (OpenAI, KCI, AWS, etc.)
   */
  async trackUsage(data: {
    provider: string;
    operation: string;
    tokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    cost?: number;
    costUsd?: number;
    latency?: number;
    statusCode?: number;
    userId?: string;
    familyId?: string;
    groupId?: string;
    institutionId?: string;
    feature?: string;
    metadata?: any;
  }) {
    try {
      return await this.prisma.providerUsage.create({
        data: {
          provider: data.provider,
          model: data.metadata?.model || null,
          operation: data.operation,
          tokens: data.tokens, // Legacy/Total
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.tokens,
          costUsd: data.costUsd,
          latency: data.latency,
          statusCode: data.statusCode,
          userId: data.userId,
          familyId: data.familyId,
          groupId: data.groupId,
          institutionId: data.institutionId,
          feature: data.feature || "unknown",
          metadata: data.metadata,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to track provider usage:", error);
    }
  }

  /**
   * Get usage statistics by provider
   */
  async getUsageStats(params: { provider?: string; from: Date; to: Date }) {
    const where: any = {
      timestamp: { gte: params.from, lte: params.to },
    };

    if (params.provider) {
      where.provider = params.provider;
    }

    const stats = await this.prisma.providerUsage.aggregate({
      where,
      _sum: { tokens: true, costUsd: true },
      _count: true,
      _avg: { latency: true, costUsd: true },
    });

    return {
      totalCalls: stats._count,
      totalTokens: stats._sum.tokens || 0,
      totalCost: stats._sum.costUsd || 0,
      avgLatency: stats._avg.latency || 0,
      avgCost: stats._avg.costUsd || 0,
    };
  }

  /**
   * Get usage by provider (breakdown)
   */
  async getUsageByProvider(from: Date, to: Date) {
    const usage = await this.prisma.providerUsage.findMany({
      where: {
        timestamp: { gte: from, lte: to },
      },
      select: {
        provider: true,
        operation: true,
        tokens: true,
        costUsd: true,
        latency: true,
      },
    });

    // Group by provider
    const grouped = usage.reduce(
      (acc, u) => {
        if (!acc[u.provider]) {
          acc[u.provider] = {
            provider: u.provider,
            calls: 0,
            tokens: 0,
            cost: 0,
            latency: [],
          };
        }
        acc[u.provider].calls++;
        acc[u.provider].tokens += u.tokens || 0;
        acc[u.provider].cost += u.costUsd || 0;
        if (u.latency) acc[u.provider].latency.push(u.latency);
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(grouped).map((g: any) => ({
      provider: g.provider,
      calls: g.calls,
      tokens: g.tokens,
      cost: Number(g.cost.toFixed(4)),
      avgLatency:
        g.latency.length > 0
          ? Math.round(
              g.latency.reduce((a: number, b: number) => a + b, 0) /
                g.latency.length,
            )
          : 0,
    }));
  }

  /**
   * Get recent provider calls
   */
  async getRecentCalls(provider?: string, limit = 50) {
    return this.prisma.providerUsage.findMany({
      where: provider ? { provider } : undefined,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Cleanup old usage data (keep 180 days)
   */
  async cleanupOldUsage() {
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.providerUsage.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });

    return result.count;
  }
}
