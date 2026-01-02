import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ScopeType } from "@prisma/client";
import { BillingService } from "./billing.service";
import { ISubscriptionRepository } from "./domain/interfaces/subscription.repository.interface";
import { IPlansRepository } from "./domain/interfaces/plans.repository.interface";
import { Subscription } from "./domain/entities/subscription.entity";
import { Plan } from "./domain/entities/plan.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IPlansRepository) private readonly plansRepository: IPlansRepository,
    private billingService: BillingService,
  ) {}

  /**
   * Create FREE subscription for new user (MVP: FORCE FREE)
   */
  async createFreeSubscription(userId: string) {
    console.log(`[SubscriptionService] createFreeSubscription for ${userId}. (Using CLS TX if active)`);
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
    const existing = await this.subscriptionRepository.findActiveByScope("USER", userId);
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
      "", // stripe id
      undefined, // end date
      undefined, // metadata
      freePlan // optional plan
    );

    return this.subscriptionRepository.create(newSub);
  }

  /**
   * Create initial subscription for any scope
   */
  async createInitialSubscription(
    scopeType: ScopeType,
    scopeId: string,
  ) {
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
    return this.subscriptionRepository.hasActiveSubscription(scopeType, scopeId);
  }

  /**
   * Assign plan (Admin) - Placeholder
   */
  async assignPlan(
    scopeType: ScopeType,
    scopeId: string,
    planCode: string,
    adminUserId: string,
    reason: string,
  ) {
    // Placeholder implementation
    return {
      status: "implemented_soon",
      subscription: { id: "mock-subscription-id" },
      before: null,
      after: null,
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
    const subscription = await this.subscriptionRepository.findActiveByScope(scopeType, scopeId);

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
