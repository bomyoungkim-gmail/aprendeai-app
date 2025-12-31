import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GetAggregatedMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(from: Date, to: Date) {
    const aggregations = await this.prisma.provider_usage.aggregate({
      where: {
        timestamp: { gte: from, lte: to },
      },
      _sum: {
        total_tokens: true,
        cost_usd: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        latency: true,
      },
    });

    return {
      totalRequests: aggregations._count.id,
      totalTokens: aggregations._sum.total_tokens || 0,
      totalCostUsd: aggregations._sum.cost_usd || 0,
      avgLatency: aggregations._avg.latency || 0,
    };
  }
}
