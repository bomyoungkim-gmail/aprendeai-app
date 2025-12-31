import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScopeType, Environment } from "@prisma/client";

@Injectable()
export class UsageTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Track usage event
   */
  async trackUsage(data: {
    scopeType: ScopeType;
    scopeId: string;
    metric: string;
    quantity: number;
    environment: Environment;
    providerCode?: string;
    endpoint?: string;
    approxCostUsd?: number;
    requestId?: string;
    userId?: string;
    metadata?: any;
  }) {
    // Import uuid
    const { v4: uuidv4 } = require("uuid");
    return this.prisma.usage_events.create({
      data: {
        id: uuidv4(),
        scope_type: data.scopeType,
        scope_id: data.scopeId,
        metric: data.metric,
        quantity: data.quantity,
        environment: data.environment,
        provider_code: data.providerCode,
        endpoint: data.endpoint,
        approx_cost_usd: data.approxCostUsd,
        request_id: data.requestId,
        user_id: data.userId,
        metadata: data.metadata,
        occurred_at: new Date(),
      },
    });
  }

  /**
   * Get current usage for scope
   */
  async getCurrentUsage(
    scopeType: ScopeType,
    scopeId: string,
    metric: string,
    range: "today" | "7d" | "30d" = "today",
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const result = await this.prisma.usage_events.aggregate({
      where: {
        scope_type: scopeType,
        scope_id: scopeId,
        metric,
        occurred_at: {
          gte: startDate,
        },
      },
      _sum: {
        quantity: true,
        approx_cost_usd: true,
      },
      _count: true,
    });

    return {
      metric,
      range,
      totalQuantity: result._sum.quantity || 0,
      totalCost: result._sum.approx_cost_usd || 0,
      eventCount: result._count,
    };
  }

  /**
   * Get usage stats (all metrics)
   */
  async getUsageStats(
    scopeType: ScopeType,
    scopeId: string,
    range: "today" | "7d" | "30d" = "today",
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const events = await this.prisma.usage_events.findMany({
      where: {
        scope_type: scopeType,
        scope_id: scopeId,
        occurred_at: {
          gte: startDate,
        },
      },
      orderBy: {
        occurred_at: "desc",
      },
      take: 100, // Latest 100 events
    });

    // Group by metric
    const byMetric: Record<
      string,
      {
        quantity: number;
        cost: number;
        count: number;
      }
    > = {};

    events.forEach((event) => {
      if (!byMetric[event.metric]) {
        byMetric[event.metric] = { quantity: 0, cost: 0, count: 0 };
      }
      byMetric[event.metric].quantity += event.quantity;
      byMetric[event.metric].cost += event.approx_cost_usd || 0;
      byMetric[event.metric].count++;
    });

    return {
      range,
      metrics: byMetric,
      recentEvents: events.slice(0, 10), // Latest 10
      totalCost: events.reduce((sum, e) => sum + (e.approx_cost_usd || 0), 0),
    };
  }

  /**
   * Get usage by provider
   */
  async getUsageByProvider(
    scopeType: ScopeType,
    scopeId: string,
    range: "today" | "7d" | "30d" = "30d",
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const events = await this.prisma.usage_events.groupBy({
      by: ["provider_code"],
      where: {
        scope_type: scopeType,
        scope_id: scopeId,
        occurred_at: {
          gte: startDate,
        },
        provider_code: {
          not: null,
        },
      },
      _sum: {
        quantity: true,
        approx_cost_usd: true,
      },
      _count: true,
    });

    return events.map((e) => ({
      provider: e.provider_code,
      totalQuantity: e._sum.quantity || 0,
      totalCost: e._sum.approx_cost_usd || 0,
      callCount: e._count,
    }));
  }
}
