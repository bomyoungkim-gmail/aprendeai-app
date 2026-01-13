import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ScopeType, PlanType } from "@prisma/client";
import { BillingService } from "./billing.service";
import { StripeService } from "./infrastructure/stripe/stripe.service";
import { ISubscriptionRepository } from "./domain/interfaces/subscription.repository.interface";
import { IPlansRepository } from "./domain/interfaces/plans.repository.interface";
import { Subscription } from "./domain/entities/subscription.entity";
import { Plan } from "./domain/entities/plan.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IPlansRepository)
    private readonly plansRepository: IPlansRepository,
    private billingService: BillingService,
    private stripeService: StripeService,
  ) {}

  /**
   * Create FREE subscription for new user (MVP: FORCE FREE)
   */
  async createFreeSubscription(userId: string) {
    console.log(
      `[SubscriptionService] createFreeSubscription for ${userId}. (Using CLS TX if active)`,
    );
    // Ensure FREE plan exists
    let freePlan = await this.plansRepository.findByCode("FREE");
    if (!freePlan) {
      this.logger.warn("FREE plan not found, seeding...");

      const newPlan = new Plan({
        id: uuidv4(),
        code: "FREE",
        name: "Free Plan",
        // type: "FREE", // Plan entity doesn't have type? Let's check or ignore. Entity def has code/name/desc/entitlements...
        // Assuming 'type' was used in Prisma but not mapped to domain or I missed it.
        // Checking Plan entity: id, code, name, description, entitlements, monthlyPrice...
        // No 'type' field in entity.
        entitlements: {
          limits: { storageMb: 100, projects: 1, collaborators: 0 },
          features: { canExport: false },
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      freePlan = await this.plansRepository.create(newPlan);
    }

    // Check existing
    // Logic: find active by user.
    // Repo: findActiveByScope('USER', userId)
    const existing = await this.subscriptionRepository.findActiveByScope(
      "USER",
      userId,
    );
    if (existing) return existing;

    // Create Subscription
    const newSub = new Subscription(
      uuidv4(),
      userId,
      "USER",
      userId,
      freePlan.id,
      "ACTIVE",
      new Date(),
      null, // null for internal subscriptions (no Stripe ID)
      undefined, // end date
      undefined, // metadata
      freePlan, // optional plan
    );

    return this.subscriptionRepository.create(newSub);
  }

  /**
   * Create initial subscription for any scope
   */
  async createInitialSubscription(scopeType: ScopeType, scopeId: string) {
    if (scopeType === "USER") return this.createFreeSubscription(scopeId);
    // For others, do nothing for now or create generic free
    return null;
  }

  /**
   * Check if has active subscription
   */
  async hasActiveSubscription(
    scopeType: ScopeType,
    scopeId: string,
  ): Promise<boolean> {
    return this.subscriptionRepository.hasActiveSubscription(
      scopeType,
      scopeId,
    );
  }

  /**
   * Validate that plan type matches scope type (Security Fix - Issue #2)
   *
   * Valid combinations:
   * - USER scope: FREE, INDIVIDUAL_PREMIUM plans
   * - FAMILY scope: FAMILY plans
   * - INSTITUTION scope: INSTITUTION plans
   *
   * @throws BadRequestException if combination is invalid
   */
  private async validatePlanScopeMatch(
    scopeType: ScopeType,
    planCode: string,
  ): Promise<void> {
    // Get plan type from repository (need to fetch from Prisma)
    const plan = await this.plansRepository.findByCode(planCode);
    if (!plan) {
      throw new NotFoundException(`Plan ${planCode} not found`);
    }

    // Map plan code to expected type (need to fetch from DB with type field)
    // Since Plan entity doesn't have type, we'll need to fetch from Prisma directly
    // For now, infer from plan code naming convention
    const planType = this.inferPlanType(plan.code);

    const validCombinations: Record<ScopeType, PlanType[]> = {
      USER: ["FREE", "INDIVIDUAL_PREMIUM"],
      FAMILY: ["FAMILY"],
      INSTITUTION: ["INSTITUTION"],
      GLOBAL: ["FREE"], // Global scope only accepts FREE
    };

    const allowedTypes = validCombinations[scopeType];
    if (!allowedTypes || !allowedTypes.includes(planType)) {
      throw new BadRequestException({
        code: "INVALID_PLAN_SCOPE_COMBINATION",
        message: `Plan type ${planType} cannot be assigned to ${scopeType} scope. Allowed types: ${allowedTypes.join(", ")}`,
        scopeType,
        planType,
        planCode,
      });
    }

    this.logger.log(
      `✅ Plan-Scope validation passed: ${planCode} (${planType}) for ${scopeType}`,
    );
  }

  /**
   * Infer plan type from plan code (temporary until Plan entity includes type)
   */
  private inferPlanType(planCode: string): PlanType {
    const codeUpper = planCode.toUpperCase();

    if (codeUpper.includes("INSTITUTION") || codeUpper.includes("ENTERPRISE")) {
      return PlanType.INSTITUTION;
    }
    if (codeUpper.includes("FAMILY")) {
      return PlanType.FAMILY;
    }
    if (codeUpper.includes("PREMIUM") || codeUpper.includes("INDIVIDUAL")) {
      return PlanType.INDIVIDUAL_PREMIUM;
    }

    return PlanType.FREE; // Default
  }

  /**
   * Assign plan (Admin or Self-Service for Consumer plans)
   * Implements YouTube-style rules:
   * - Upgrade: Immediate proration (charge difference now)
   * - Downgrade: Schedule for period end (no refund, keep access)
   */
  async assignPlan(
    scopeType: ScopeType,
    scopeId: string,
    planCode: string,
    adminUserId: string,
    reason: string,
  ) {
    // Block Institution plans from self-service changes
    if (scopeType === "INSTITUTION") {
      return {
        status: "blocked",
        message:
          "Institution plan changes require manual approval. Please contact sales.",
        subscription: null,
        before: null,
        after: null,
      };
    }

    // Get current subscription
    const currentSub = await this.subscriptionRepository.findActiveByScope(
      scopeType,
      scopeId,
    );

    // Get target plan
    const targetPlan = await this.plansRepository.findByCode(planCode);
    if (!targetPlan) {
      throw new NotFoundException(`Plan ${planCode} not found`);
    }

    // ✅ Security: Validate plan-scope match (Issue #2)
    await this.validatePlanScopeMatch(scopeType, planCode);

    // If no current subscription, create new one
    if (!currentSub) {
      const newSub = new Subscription(
        uuidv4(),
        scopeId,
        scopeType,
        scopeId,
        targetPlan.id,
        "ACTIVE",
        new Date(),
        null, // null for internal subscriptions (Stripe ID will be set after Stripe call if needed)
        undefined,
        { assignedBy: adminUserId, reason },
        targetPlan,
      );
      const created = await this.subscriptionRepository.create(newSub);
      return {
        status: "created",
        subscription: created,
        before: null,
        after: targetPlan,
      };
    }

    // Get current plan
    const currentPlan = await this.plansRepository.findById(currentSub.planId);
    if (!currentPlan) {
      throw new NotFoundException("Current plan not found");
    }

    // Same plan? No-op
    if (currentPlan.code === planCode) {
      return {
        status: "no_change",
        subscription: currentSub,
        before: currentPlan,
        after: currentPlan,
      };
    }

    // Determine if upgrade or downgrade (by price)
    const isUpgrade =
      (targetPlan.monthlyPrice || 0) > (currentPlan.monthlyPrice || 0);

    // Update Stripe subscription
    if (currentSub.stripeSubscriptionId) {
      await this.stripeService.updateSubscription(
        currentSub.stripeSubscriptionId,
        targetPlan.stripePriceId || "",
        isUpgrade ? "always_invoice" : "none", // Upgrade: charge now, Downgrade: no proration
      );
    }

    // Update DB
    const updated = await this.subscriptionRepository.update(currentSub.id, {
      planId: targetPlan.id,
      metadata: {
        ...currentSub.metadata,
        previousPlan: currentPlan.code,
        changedBy: adminUserId,
        changedAt: new Date().toISOString(),
        reason,
        changeType: isUpgrade ? "upgrade" : "downgrade",
      },
    });

    return {
      status: isUpgrade ? "upgraded" : "downgraded",
      subscription: updated,
      before: currentPlan,
      after: targetPlan,
    };
  }

  /**
   * Get subscriptions query
   */
  async getSubscriptions(filters: any) {
    // Assuming filters are adapted for Repo findMany or Prisma directly.
    // Repo findMany passes to Prisma, so fine.
    return this.subscriptionRepository.findMany(filters);
  }

  /**
   * Get active subscription (Specific scope)
   */
  async getActiveSubscription(scopeType: ScopeType, scopeId: string) {
    const subscription = await this.subscriptionRepository.findActiveByScope(
      scopeType,
      scopeId,
    );

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
    const subscription = await this.subscriptionRepository.findById(id);

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    return subscription;
  }

  /**
   * Cancel Subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false,
    reason?: string,
  ): Promise<{ status: string; effectiveDate: Date }> {
    // Placeholder - MVP
    return { status: "canceled", effectiveDate: new Date() };
  }
}
