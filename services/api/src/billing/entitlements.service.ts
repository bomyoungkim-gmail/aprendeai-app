import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeType, Environment } from '@prisma/client';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class EntitlementsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Resolve entitlements for scope (NO IMPLICIT FALLBACK)
   * Throws InternalServerErrorException if no subscription found
   */
  async resolve(scopeType: ScopeType, scopeId: string, environment: Environment) {
    // 1. Get active subscription (throws if missing - NO FALLBACK)
    const subscription = await this.subscriptionService.getActiveSubscription(scopeType, scopeId);

    // 2. Get plan entitlements
    const planEntitlements = subscription.plan.entitlements as {
      features: Record<string, any>;
      limits: Record<string, number>;
    };

    // 3. Get overrides (if any)
    const override = await this.prisma.entitlementOverride.findUnique({
      where: {
        scopeType_scopeId: {
          scopeType,
          scopeId,
        },
      },
    });

    // 4. Merge (deep merge with override priority)
    const finalEntitlements = override
      ? this.deepMerge(planEntitlements, override.overrides as any)
      : planEntitlements;

    return {
      planCode: subscription.plan.code,
      planName: subscription.plan.name,
      planDescription: subscription.plan.description,
      features: finalEntitlements.features || {},
      limits: finalEntitlements.limits || {},
      subscription: {
        id: subscription.id,
        status: subscription.status,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        source: subscription.source,
      },
      hasOverrides: !!override,
    };
  }

  /**
   * Deep merge two objects (override has priority)
   */
  private deepMerge(base: any, override: any): any {
    const result = { ...base };

    for (const key in override) {
      if (override[key] !== null && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.deepMerge(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }

    return result;
  }

  /**
   * Set entitlement overrides (Admin only)
   */
  async setOverrides(
    scopeType: ScopeType,
    scopeId: string,
    overrides: any,
    reason: string,
    adminUserId: string,
  ) {
    return this.prisma.entitlementOverride.upsert({
      where: {
        scopeType_scopeId: {
          scopeType,
          scopeId,
        },
      },
      create: {
        scopeType,
        scopeId,
        overrides,
        reason,
        updatedBy: adminUserId,
      },
      update: {
        overrides,
        reason,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Remove overrides
   */
  async removeOverrides(scopeType: ScopeType, scopeId: string) {
    try {
      await this.prisma.entitlementOverride.delete({
        where: {
          scopeType_scopeId: {
            scopeType,
            scopeId,
          },
        },
      });
    } catch (error) {
      // Ignore if doesn't exist
    }
  }

  /**
   * Get overrides (if exist)
   */
  async getOverrides(scopeType: ScopeType, scopeId: string) {
    return this.prisma.entitlementOverride.findUnique({
      where: {
        scopeType_scopeId: {
          scopeType,
          scopeId,
        },
      },
    });
  }
}
