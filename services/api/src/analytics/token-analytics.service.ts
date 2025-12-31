import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TokenAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get total usage metrics within a date range
   */
  async getAggregatedMetrics(from: Date, to: Date) {
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

  /**
   * Get time-series evolution of usage
   */
  async getEvolution(from: Date, to: Date, interval: "day" | "hour" = "day") {
    // Using raw query for efficient date_trunc grouping
    const intervalSql = interval === "hour" ? "hour" : "day";

    // Note: Prisma raw query returns plain objects.
    // Ensure table name matches @map("provider_usage")
    const series = await this.prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC(${Prisma.sql`${intervalSql}`}, timestamp) as date,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM provider_usage
      WHERE timestamp >= ${from} AND timestamp <= ${to}
      GROUP BY DATE_TRUNC(${Prisma.sql`${intervalSql}`}, timestamp)
      ORDER BY date ASC
    `;

    return series.map((row) => ({
      date: row.date,
      requests: Number(row.requests),
      tokens: Number(row.tokens || 0),
      cost: Number(row.cost || 0),
    }));
  }

  /**
   * Get aggregated usage by a specific dimension (provider, feature, model)
   */
  async getDistribution(
    dimension: "provider" | "model" | "feature" | "operation",
    from: Date,
    to: Date,
  ) {
    // We can use groupBy for standard fields, but we need dynamic grouping
    // provider, model, operation, feature are columns.

    // Check allowlist
    const validDimensions = ["provider", "model", "feature", "operation"];
    if (!validDimensions.includes(dimension)) {
      throw new Error(`Invalid dimension: ${dimension}`);
    }

    // Dynamic query building requires care with Prisma.
    // Using Prisma.sql for safety is best, but table columns are identifiers.
    // Since we validate input against allowlist, we can use unsafe injection for column name safely?
    // Actually, Prisma's groupBy is safer.

    // Mapping dimension to Prisma field key
    // dimension 'model' -> model is nullable.

    const groupByResult = await this.prisma.provider_usage.groupBy({
      by: [dimension as any],
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
    });

    return groupByResult.map((g) => ({
      key: g[dimension],
      requests: g._count.id,
      tokens: g._sum.total_tokens || 0,
      cost: g._sum.cost_usd || 0,
    }));
  }

  /**
   * Identify top consumers (Users or Families)
   */
  async getTopConsumers(
    entity: "user" | "family" | "institution",
    from: Date,
    to: Date,
    limit: number = 10,
  ) {
    const colMap = {
      user: "user_id",
      family: "family_id",
      institution: "institution_id",
    };
    const colName = colMap[entity];

    if (!colName) throw new Error("Invalid entity type");

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        ${Prisma.sql([colName])} as id,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM provider_usage
      WHERE timestamp >= ${from} AND timestamp <= ${to} AND ${Prisma.sql([colName])} IS NOT NULL
      GROUP BY ${Prisma.sql([colName])}
      ORDER BY cost DESC
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      id: row.id,
      requests: Number(row.requests),
      tokens: Number(row.tokens || 0),
      cost: Number(row.cost || 0),
    }));
  }
}

import { Prisma } from "@prisma/client";
