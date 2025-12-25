import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScopeType, SubscriptionStatus, PlanType } from "@prisma/client";
import { BillingService } from "./billing.service";
import { EntitlementsService } from "./entitlements.service";

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    // Circular dependency warning: EntitlementsService might need SubscriptionService. 
    // In this design, EntitlementsService depends on SubscriptionService, so we shouldn't inject EntitlementsService here directly to avoid cycle if possible.
    // However, to trigger snapshot refresh, we might need it. Better to use Event Emitter or forwardRef.
    // For MVP, checking if EntitlementsService is actually needed here. 
    // TODO(github): Review circular dependency potential if EntitlementsService calls SubscriptionService    // Yes, createFreeSubscription -> refreshSnapshot.
    // Will skip injecting EntitlementsService in constructor to avoid circular dependency for now and rely on manual call or event if strictly needed.
    // Actually, createFreeSubscription is called by Auth, which can then call EntitlementsService.
    // Or we use ModuleRef.
  ) {}

  /**
   * Create FREE subscription for new user (MVP: FORCE FREE)
   */
  async createFreeSubscription(userId: string, tx?: any) {
    const prisma = tx || this.prisma;
    
    // Ensure FREE plan exists
    let freePlan = await prisma.plan.findUnique({ where: { code: "FREE" } });
    if (!freePlan) {
      this.logger.warn("FREE plan not found, seeding...");
      // Auto-seed if missing
      freePlan = await prisma.plan.create({
        data: {
          code: "FREE",
          name: "Free Plan",
          type: "FREE",
          entitlements: {
            limits: { storageMb: 100, projects: 1, collaborators: 0 },
            features: { canExport: false }
          },
          isActive: true
        }
      });
    }

    // Check existing
    const existing = await prisma.subscription.findFirst({
        where: {
            userId,
            status: { in: ["ACTIVE", "TRIALING"] }
        }
    });

    if (existing) return existing;

    // Create Subscription
    return prisma.subscription.create({
      data: {
        scopeType: "USER",
        scopeId: userId,
        userId: userId,
        planId: freePlan.id,
        status: "ACTIVE",
        source: "INTERNAL",
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
      },
    });
  }

  /**
   * Create initial subscription for any scope
   */
  async createInitialSubscription(scopeType: ScopeType, scopeId: string, tx?: any) {
     if (scopeType === 'USER') return this.createFreeSubscription(scopeId, tx);
     // For others, do nothing for now or create generic free
     return null;
  }

  /**
   * Check if has active subscription
   */
  async hasActiveSubscription(scopeType: ScopeType, scopeId: string): Promise<boolean> {
      const count = await this.prisma.subscription.count({
        where: {
          scopeType,
          scopeId,
          status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] }
        }
      });
      return count > 0;
  }

  /**
   * Assign plan (Admin) - Placeholder
   * TODO(github): Implement full plan assignment logic with proration and payment gateway integration
   */
  async assignPlan(scopeType: ScopeType, scopeId: string, planCode: string, adminUserId: string, reason: string) {
      // Placeholder implementation
      // TODO(github): Implement logic to update subscription plan and handle billing changes
      return { 
          status: 'implemented_soon',
          subscription: { id: 'mock-subscription-id' },
          before: null,
          after: null
      };
  }

    /**
   * Get subscriptions query
   */
  async getSubscriptions(filters: any) {
      return this.prisma.subscription.findMany({ where: filters, include: { plan: true } });
  }

  /**
   * Get active subscription (Specific scope)
   */
  async getActiveSubscription(scopeType: ScopeType, scopeId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        scopeType,
        scopeId,
        status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new InternalServerErrorException({
        code: "SUBSCRIPTION_MISSING",
        message: `No active subscription found for ${scopeType}:${scopeId}`,
      });
    }
    return subscription;
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
      throw new NotFoundException("Subscription not found");
    }

    return subscription;
  }

  /**
   * Cancel Subscription
   */
  async cancelSubscription(subscriptionId: string, immediate: boolean = false, reason?: string): Promise<{ status: string; effectiveDate: Date }> {
    // Placeholder - MVP 
    // TODO(github): Integrate with Stripe to cancel subscription and handle cancellation effective date
    return { status: "canceled", effectiveDate: new Date() };
  }
}
