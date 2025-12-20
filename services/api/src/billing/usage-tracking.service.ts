import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeType, Environment } from '@prisma/client';

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
    return this.prisma.usageEvent.create({
      data: {
        scopeType: data.scopeType,
        scopeId: data.scopeId,
        metric: data.metric,
        quantity: data.quantity,
        environment: data.environment,
        providerCode: data.providerCode,
        endpoint: data.endpoint,
        approxCostUsd: data.approxCostUsd,
        requestId: data.requestId,
        userId: data.userId,
        metadata: data.metadata,
        occurredAt: new Date(),
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
    range: 'today' | '7d' | '30d' = 'today',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const result = await this.prisma.usageEvent.aggregate({
      where: {
        scopeType,
        scopeId,
        metric,
        occurredAt: {
          gte: startDate,
        },
      },
      _sum: {
        quantity: true,
        approxCostUsd: true,
      },
      _count: true,
    });

    return {
      metric,
      range,
      totalQuantity: result._sum.quantity || 0,
      totalCost: result._sum.approxCostUsd || 0,
      eventCount: result._count,
    };
  }

  /**
   * Get usage stats (all metrics)
   */
  async getUsageStats(
    scopeType: ScopeType,
    scopeId: string,
    range: 'today' | '7d' | '30d' = 'today',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const events = await this.prisma.usageEvent.findMany({
      where: {
        scopeType,
        scopeId,
        occurredAt: {
          gte: startDate,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 100, // Latest 100 events
    });

    // Group by metric
    const byMetric: Record<string, {
      quantity: number;
      cost: number;
      count: number;
    }> = {};

    events.forEach(event => {
      if (!byMetric[event.metric]) {
        byMetric[event.metric] = { quantity: 0, cost: 0, count: 0 };
      }
      byMetric[event.metric].quantity += event.quantity;
      byMetric[event.metric].cost += event.approxCostUsd || 0;
      byMetric[event.metric].count++;
    });

    return {
      range,
      metrics: byMetric,
      recentEvents: events.slice(0, 10), // Latest 10
      totalCost: events.reduce((sum, e) => sum + (e.approxCostUsd || 0), 0),
    };
  }

  /**
   * Get usage by provider
   */
  async getUsageByProvider(
    scopeType: ScopeType,
    scopeId: string,
    range: 'today' | '7d' | '30d' = '30d',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const events = await this.prisma.usageEvent.groupBy({
      by: ['providerCode'],
      where: {
        scopeType,
        scopeId,
        occurredAt: {
          gte: startDate,
        },
        providerCode: {
          not: null,
        },
      },
      _sum: {
        quantity: true,
        approxCostUsd: true,
      },
      _count: true,
    });

    return events.map(e => ({
      provider: e.providerCode,
      totalQuantity: e._sum.quantity || 0,
      totalCost: e._sum.approxCostUsd || 0,
      callCount: e._count,
    }));
  }
}
