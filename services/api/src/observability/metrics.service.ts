import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record API request metrics (async, non-blocking)
   */
  async recordRequest(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    latency: number;
    userId?: string;
  }) {
    try {
      // Record request count
      await this.prisma.system_metrics.create({
        data: {
          id: uuidv4(),
          metric: "api_request",
          value: 1,
          tags: {
            endpoint: data.endpoint,
            method: data.method,
            status: data.statusCode,
          },
          bucket: "1m",
          timestamp: new Date(),
        },
      });

      // Record latency
      await this.prisma.system_metrics.create({
        data: {
          id: uuidv4(),
          metric: "api_latency",
          value: data.latency,
          tags: { endpoint: data.endpoint },
          bucket: "1m",
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Silent fail - don't break app if metrics fail
      console.error("Failed to record metrics:", error.message);
    }
  }

  /**
   * Get aggregated metrics for dashboard
   */
  async getMetrics(params: {
    metric: string;
    from: Date;
    to: Date;
    bucket: string;
  }) {
    return this.prisma.system_metrics.findMany({
      where: {
        metric: params.metric,
        bucket: params.bucket,
        timestamp: {
          gte: params.from,
          lte: params.to,
        },
      },
      orderBy: { timestamp: "asc" },
    });
  }

  /**
   * Get aggregated stats (count, avg, etc.)
   */
  async getStats(metric: string, from: Date, to: Date) {
    const result = await this.prisma.system_metrics.aggregate({
      where: {
        metric,
        timestamp: { gte: from, lte: to },
      },
      _count: true,
      _avg: { value: true },
      _sum: { value: true },
      _max: { value: true },
      _min: { value: true },
    });

    return result;
  }

  /**
   * Aggregate raw 1-minute metrics into hourly buckets (run by cron)
   */
  async aggregateHourlyMetrics() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();

    // Get all 1-minute metrics from last hour
    const minuteMetrics = await this.prisma.system_metrics.findMany({
      where: {
        bucket: "1m",
        timestamp: { gte: oneHourAgo, lte: now },
      },
    });

    // Group by metric and hour
    const grouped = minuteMetrics.reduce(
      (acc, m) => {
        const hour = new Date(m.timestamp);
        hour.setMinutes(0, 0, 0);
        const key = `${m.metric}-${hour.toISOString()}`;

        if (!acc[key]) {
          acc[key] = {
            metric: m.metric,
            values: [],
            timestamp: hour,
            tags: m.tags,
          };
        }
        acc[key].values.push(m.value);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Create hourly aggregates
    for (const groupObj of Object.values(grouped)) {
      const group = groupObj as any;
      const values = group.values as number[];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      await this.prisma.system_metrics.create({
        data: {
          id: uuidv4(),
          metric: group.metric,
          value: avg,
          tags: group.tags,
          bucket: "1h",
          timestamp: group.timestamp,
        },
      });
    }
  }

  /**
   * Aggregate hourly metrics into daily (run by cron)
   */
  async aggregateDailyMetrics() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const hourlyMetrics = await this.prisma.system_metrics.findMany({
      where: {
        bucket: "1h",
        timestamp: { gte: oneDayAgo, lte: now },
      },
    });

    // Group by metric and day
    const grouped = hourlyMetrics.reduce(
      (acc, m) => {
        const day = new Date(m.timestamp);
        day.setHours(0, 0, 0, 0);
        const key = `${m.metric}-${day.toISOString()}`;

        if (!acc[key]) {
          acc[key] = {
            metric: m.metric,
            values: [],
            timestamp: day,
            tags: m.tags,
          };
        }
        acc[key].values.push(m.value);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Create daily aggregates
    for (const groupObj of Object.values(grouped)) {
      const group = groupObj as any;
      const values = group.values as number[];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      await this.prisma.system_metrics.create({
        data: {
          id: uuidv4(),
          metric: group.metric,
          value: avg,
          tags: group.tags,
          bucket: "1d",
          timestamp: group.timestamp,
        },
      });
    }
  }

  /**
   * Cleanup old metrics (keep 90 days)
   */
  async cleanupOldMetrics() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.system_metrics.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });

    return result.count;
  }
}
