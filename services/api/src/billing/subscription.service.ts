import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionScope, SubscriptionStatus } from '@prisma/client';
import { BillingService } from './billing.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  /**
   * Create FREE subscription for new user (CALLED ON SIGNUP)
   */
  async createFreeSubscription(userId: string, tx?: any) {
    const prisma = tx || this.prisma;

    // Get FREE plan
    const freePlan = await this.billingService.getPlanByCode('FREE');

    // Check if user already has active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        scopeType: 'USER',
        scopeId: userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (existing) {
      return existing; // Idempotent
    }

    // Create FREE subscription
    return prisma.subscription.create({
      data: {
        scopeType: 'USER',
        scopeId: userId,
        planId: freePlan.id,
        status: 'ACTIVE',
        source: 'INTERNAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null, // FREE has no period
        cancelAtPeriodEnd: false,
      },
    });
  }

  /**
   * Get active subscription (NO FALLBACK - throws if missing)
   */
  async getActiveSubscription(scopeType: SubscriptionScope, scopeId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        scopeType,
        scopeId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new InternalServerErrorException({
        code: 'SUBSCRIPTION_MISSING',
        message: `No active subscription found for ${scopeType}:${scopeId}`,
        scopeType,
        scopeId,
      });
    }

    return subscription;
  }

  /**
   * Check if has active subscription (boolean check)
   */
  async hasActiveSubscription(scopeType: SubscriptionScope, scopeId: string): Promise<boolean> {
    const count = await this.prisma.subscription.count({
      where: {
        scopeType,
        scopeId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    return count > 0;
  }

  /**
   * Assign plan manually (Admin upgrade/downgrade)
   */
  async assignPlan(
    scopeType: SubscriptionScope,
    scopeId: string,
    planCode: string,
    adminUserId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Get new plan
      const newPlan = await this.billingService.getPlanByCode(planCode);

      // Cancel existing active subscription
      const existing = await tx.subscription.findFirst({
        where: {
          scopeType,
          scopeId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
        include: { plan: true },
      });

      if (existing) {
        await tx.subscription.update({
          where: { id: existing.id },
          data: {
            status: 'CANCELED',
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          },
        });
      }

      // Create new subscription
      const newSubscription = await tx.subscription.create({
        data: {
          scopeType,
          scopeId,
          planId: newPlan.id,
          status: 'ACTIVE',
          source: 'INTERNAL',
          currentPeriodStart: new Date(),
          currentPeriodEnd: null, // For internal subscriptions
        },
        include: { plan: true },
      });

      return {
        before: existing ? {
          planCode: existing.plan.code,
          planName: existing.plan.name,
        } : null,
        after: {
          planCode: newSubscription.plan.code,
          planName: newSubscription.plan.name,
        },
        subscription: newSubscription,
      };
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    id: string,
    cancelAtPeriodEnd: boolean,
    reason: string,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // If canceling a paid plan and immediate, auto-create FREE
    if (subscription.plan.code !== 'FREE' && !cancelAtPeriodEnd) {
      return this.prisma.$transaction(async (tx) => {
        // Cancel current
        await tx.subscription.update({
          where: { id },
          data: {
            status: 'CANCELED',
            cancelAtPeriodEnd: false,
          },
        });

        // Create FREE automatically
        const freePlan = await this.billingService.getPlanByCode('FREE');
        return tx.subscription.create({
          data: {
            scopeType: subscription.scopeType,
            scopeId: subscription.scopeId,
            planId: freePlan.id,
            status: 'ACTIVE',
            source: 'INTERNAL',
            currentPeriodStart: new Date(),
          },
        });
      });
    }

    // Just set cancel flag
    return this.prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? subscription.status : 'CANCELED',
      },
    });
  }

  /**
   * Get subscriptions (admin query)
   */
  async getSubscriptions(filters?: {
    scopeType?: SubscriptionScope;
    scopeId?: string;
    status?: SubscriptionStatus;
    planId?: string;
  }) {
    return this.prisma.subscription.findMany({
      where: filters,
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }
}
