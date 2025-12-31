import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScopeType, PlanType, EntitlementScopeType } from "@prisma/client";
import { SubscriptionService } from "./subscription.service";

// Default Free Limits
export const FREE_LIMITS = {
  storageMb: 100,
  projects: 1,
  collaborators: 0,
  canExport: false,
};

@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Compute effective entitlements by traversing hierarchy:
   * 1. Organization (Institution)
   * 2. Family
   * 3. User (Individual)
   * 4. Default (Free)
   */
  async computeEntitlements(userId: string): Promise<{
    source: string;
    planType: PlanType;
    limits: any;
    features: any;
  }> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        institution_members: {
          include: {
            institutions: {
              include: {
                subscriptions: {
                  where: {
                    status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
                  },
                  include: { plans: true },
                  orderBy: { created_at: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        family_members: {
          include: {
            families: {
              include: {
                subscriptions: {
                  where: {
                    status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
                  },
                  include: { plans: true },
                  orderBy: { created_at: "desc" },
                  take: 1,
                },
              },
            },
          },
          where: { status: "ACTIVE" },
        },
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] } },
          include: { plans: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        source: "FREE",
        planType: "FREE",
        limits: FREE_LIMITS,
        features: {},
      };
    }

    // 1. Check Institution (Org) - Schema says one-to-one (singular)
    if (user.institution_members) {
      const membership = user.institution_members as any;
      if (membership.status === "ACTIVE") {
        const sub = (membership.institutions.subscriptions as any[])[0];
        if (sub) {
          return {
            source: "ORG",
            planType: "INSTITUTION",
            limits: (sub.plans.entitlements as any)["limits"] || {},
            features: (sub.plans.entitlements as any)["features"] || {},
          };
        }
      }
    }

    // 2. Check Family - Schema says one-to-many (array)
    for (const membership of user.family_members) {
      const sub = (membership.families.subscriptions as any[])[0];
      if (sub) {
        return {
          source: "FAMILY",
          planType: "FAMILY",
          limits: (sub.plans.entitlements as any)["limits"] || {},
          features: (sub.plans.entitlements as any)["features"] || {},
        };
      }
    }

    // 3. Check Individual
    const individualSub = user.subscriptions[0];
    if (individualSub) {
      return {
        source: "INDIVIDUAL",
        planType: individualSub.plans.type,
        limits: (individualSub.plans.entitlements as any)["limits"] || {},
        features: (individualSub.plans.entitlements as any)["features"] || {},
      };
    }

    // 4. Default Free
    const freePlan = await this.prisma.plans.findUnique({
      where: { code: "FREE" },
    });
    const freeLimits = freePlan?.entitlements
      ? (freePlan.entitlements as any)["limits"]
      : FREE_LIMITS;
    const freeFeatures = freePlan?.entitlements
      ? (freePlan.entitlements as any)["features"]
      : {};

    return {
      source: "FREE",
      planType: "FREE",
      limits: freeLimits,
      features: freeFeatures,
    };
  }

  async resolve(scopeType: string, scopeId: string, environment?: string) {
    if (scopeType === "USER") {
      return this.resolveUser(scopeId);
    }

    const sub = await this.prisma.subscriptions.findFirst({
      where: {
        scope_type: scopeType as ScopeType,
        scope_id: scopeId,
        status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
      },
      include: { plans: true },
      orderBy: { created_at: "desc" },
    });

    if (sub) {
      return {
        source: "DIRECT",
        planType: sub.plans.type,
        limits: (sub.plans.entitlements as any)["limits"] || {},
        features: (sub.plans.entitlements as any)["features"] || {},
      };
    }

    return {
      source: "DEFAULT",
      planType: "FREE",
      limits: FREE_LIMITS,
      features: {},
    };
  }

  async getEntitlement(
    userId: string,
    scopeType: EntitlementScopeType = EntitlementScopeType.USER,
    scopeId?: string,
  ) {
    const effectiveScopeId = scopeId || userId;

    const snapshot = await this.prisma.entitlement_snapshots.findFirst({
      where: {
        user_id: userId,
        scope_type: scopeType,
        scope_id: effectiveScopeId,
      },
      orderBy: { expires_at: "desc" },
    });

    if (snapshot && snapshot.expires_at && snapshot.expires_at > new Date()) {
      return snapshot;
    }

    if (scopeType !== EntitlementScopeType.USER) {
      return this.getEntitlement(userId, EntitlementScopeType.USER, userId);
    }

    return this.refreshSnapshot(userId);
  }

  async resolveUser(userId: string) {
    const snapshot = await this.prisma.entitlement_snapshots.findFirst({
      where: {
        user_id: userId,
        scope_type: EntitlementScopeType.USER,
      },
      orderBy: { expires_at: "desc" },
    });

    if (
      !snapshot ||
      (snapshot.expires_at && snapshot.expires_at < new Date())
    ) {
      return await this.refreshSnapshot(userId);
    }

    return snapshot;
  }

  async setOverrides(
    scopeType: string,
    scopeId: string,
    overrides: any,
    reason: string,
    adminUserId: string,
  ) {
    return (this.prisma as any).entitlement_overrides.upsert({
      where: {
        scope_type_scope_id: {
          scope_type: scopeType,
          scope_id: scopeId,
        },
      },
      create: {
        scope_type: scopeType,
        scope_id: scopeId,
        overrides,
        reason,
        updated_by: adminUserId,
      },
      update: {
        overrides,
        reason,
        updated_by: adminUserId,
      },
    });
  }

  async removeOverrides(scopeType: string, scopeId: string) {
    try {
      await (this.prisma as any).entitlement_overrides.delete({
        where: {
          scope_type_scope_id: {
            scope_type: scopeType,
            scope_id: scopeId,
          },
        },
      });
    } catch (error) {}
  }

  async getOverrides(scopeType: string, scopeId: string) {
    return (this.prisma as any).entitlement_overrides.findUnique({
      where: {
        scope_type_scope_id: {
          scope_type: scopeType,
          scope_id: scopeId,
        },
      },
    });
  }

  async refreshSnapshot(userId: string) {
    const computed = await this.computeEntitlements(userId);
    const { v4: uuidv4 } = require("uuid");

    return this.prisma.entitlement_snapshots.upsert({
      where: {
        user_id_scope_type_scope_id: {
          user_id: userId,
          scope_type: EntitlementScopeType.USER,
          scope_id: userId,
        },
      },
      create: {
        id: uuidv4(),
        updated_at: new Date(),
        users: { connect: { id: userId } },
        source: computed.source,
        plan_type: computed.planType,
        limits: computed.limits || {},
        features: computed.features || {},
        scope_type: EntitlementScopeType.USER,
        scope_id: userId,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h cache
      },
      update: {
        source: computed.source,
        plan_type: computed.planType,
        limits: computed.limits || {},
        features: computed.features || {},
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h cache
      },
    });
  }

  async forceRefreshForScope(scopeType: EntitlementScopeType, scopeId: string) {
    this.logger.log(`Forcing entitlement refresh for ${scopeType}:${scopeId}`);
    if (scopeType === EntitlementScopeType.USER) {
      await this.refreshSnapshot(scopeId);
    } else if (scopeType === EntitlementScopeType.FAMILY) {
      const members = await this.prisma.family_members.findMany({
        where: { family_id: scopeId },
      });
      for (const m of members) await this.refreshSnapshot(m.user_id);
    }
  }
}
