import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { v4 as uuidv4 } from "uuid";

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
      return await this.prisma.provider_usage.create({
        data: {
          id: uuidv4(),
          provider: data.provider,
          model: data.metadata?.model || null,
          operation: data.operation,
          tokens: data.tokens, // Legacy/Total
          prompt_tokens: data.promptTokens,
          completion_tokens: data.completionTokens,
          total_tokens: data.tokens,
          cost_usd: data.costUsd,
          latency: data.latency,
          status_code: data.statusCode,
          user_id: data.userId,
          family_id: data.familyId,
          group_id: data.groupId,
          institution_id: data.institutionId,
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

    const stats = await this.prisma.provider_usage.aggregate({
      where,
      _sum: { tokens: true, cost_usd: true },
      _count: true,
      _avg: { latency: true, cost_usd: true },
    });

    return {
      totalCalls: stats._count,
      totalTokens: stats._sum.tokens || 0,
      totalCost: stats._sum.cost_usd || 0,
      avgLatency: stats._avg.latency || 0,
      avgCost: stats._avg.cost_usd || 0,
    };
  }

  /**
   * Get usage by provider (breakdown)
   */
  async getUsageByProvider(from: Date, to: Date) {
    const usage = await this.prisma.provider_usage.findMany({
      where: {
        timestamp: { gte: from, lte: to },
      },
      select: {
        provider: true,
        operation: true,
        tokens: true,
        cost_usd: true,
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
        acc[u.provider].cost += u.cost_usd || 0;
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
    return this.prisma.provider_usage.findMany({
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

    const result = await this.prisma.provider_usage.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });

    return result.count;
  }
}
