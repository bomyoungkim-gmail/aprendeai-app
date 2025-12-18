import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlanLimits {
  highlightsPerMonth: number;
  cornellNotesPerMonth: number;
  contentsPerMonth: number;
}

@Injectable()
export class PlanLimitsService {
  constructor(private prisma: PrismaService) {}

  // Define limits per plan type
  private readonly PLAN_LIMITS: Record<string, PlanLimits> = {
    FREE: {
      highlightsPerMonth: 50,
      cornellNotesPerMonth: 10,
      contentsPerMonth: 5,
    },
    BASIC: {
      highlightsPerMonth: 500,
      cornellNotesPerMonth: 100,
      contentsPerMonth: 50,
    },
    PRO: {
      highlightsPerMonth: -1, // unlimited
      cornellNotesPerMonth: -1,
      contentsPerMonth: -1,
    },
    ENTERPRISE: {
      highlightsPerMonth: -1,
      cornellNotesPerMonth: -1,
      contentsPerMonth: -1,
    },
  };

  async getUserLimits(userId: string): Promise<PlanLimits> {
    // Get user's active subscription
    // Note: Subscription schema uses planId but doesn't have explicit relation
    // We'll just use planId to fetch the plan separately
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        scopeType: 'USER',
        scopeId: userId,
        status: 'ACTIVE' 
      },
    });

    if (subscription?.planId) {
      const plan = await this.prisma.billingPlan.findUnique({
        where: { id: subscription.planId }
      });
      const planName = plan?.name?.toUpperCase() || 'FREE';
      return this.PLAN_LIMITS[planName] || this.PLAN_LIMITS.FREE;
    }

    // Default to FREE if no subscription
    return this.PLAN_LIMITS.FREE;
  }

  async checkQuota(userId: string, metric: string): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    const limitKey = `${metric}PerMonth` as keyof PlanLimits;
    const limit = limits[limitKey];

    // Unlimited (-1)
    if (limit === -1) return true;

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.getUsageCount(userId, metric, startOfMonth);

    return count < limit;
  }

  private async getUsageCount(
    userId: string,
    metric: string,
    startDate: Date
  ): Promise<number> {
    // Map metric to database table
    switch (metric) {
      case 'highlights':
        return this.prisma.highlight.count({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
        });

      case 'cornellNotes':
        return this.prisma.cornellNotes.count({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
        });

      case 'contents':
        return this.prisma.content.count({
          where: {
            ownerUserId: userId,
            createdAt: { gte: startDate },
          },
        });

      default:
        return 0;
    }
  }

  async getRemainingQuota(userId: string, metric: string): Promise<number> {
    const limits = await this.getUserLimits(userId);
    const limitKey = `${metric}PerMonth` as keyof PlanLimits;
    const limit = limits[limitKey];

    if (limit === -1) return -1; // unlimited

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.getUsageCount(userId, metric, startOfMonth);
    return Math.max(0, limit - count);
  }
}
