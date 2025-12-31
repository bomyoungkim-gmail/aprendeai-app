import { ScopeType } from "@prisma/client";
import { BillingService } from "./billing.service";
import { ISubscriptionRepository } from "./domain/interfaces/subscription.repository.interface";
import { IPlansRepository } from "./domain/interfaces/plans.repository.interface";
import { Subscription } from "./domain/entities/subscription.entity";
export declare class SubscriptionService {
    private readonly subscriptionRepository;
    private readonly plansRepository;
    private billingService;
    private readonly logger;
    constructor(subscriptionRepository: ISubscriptionRepository, plansRepository: IPlansRepository, billingService: BillingService);
    createFreeSubscription(userId: string): Promise<Subscription>;
    createInitialSubscription(scopeType: ScopeType, scopeId: string): Promise<Subscription>;
    hasActiveSubscription(scopeType: ScopeType, scopeId: string): Promise<boolean>;
    assignPlan(scopeType: ScopeType, scopeId: string, planCode: string, adminUserId: string, reason: string): Promise<{
        status: string;
        subscription: {
            id: string;
        };
        before: any;
        after: any;
    }>;
    getSubscriptions(filters: any): Promise<Subscription[]>;
    getActiveSubscription(scopeType: ScopeType, scopeId: string): Promise<Subscription>;
    getSubscriptionById(id: string): Promise<Subscription>;
    cancelSubscription(subscriptionId: string, immediate?: boolean, reason?: string): Promise<{
        status: string;
        effectiveDate: Date;
    }>;
}
