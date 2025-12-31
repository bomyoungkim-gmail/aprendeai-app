import { SubscriptionService } from "./subscription.service";
import { EntitlementsService } from "./entitlements.service";
import { UsageTrackingService } from "./usage-tracking.service";
import { UsageRangeDto } from "./dto/billing.dto";
export declare class UserBillingController {
    private subscriptionService;
    private entitlementsService;
    private usageTrackingService;
    constructor(subscriptionService: SubscriptionService, entitlementsService: EntitlementsService, usageTrackingService: UsageTrackingService);
    getMySubscription(req: any): Promise<import("./domain/entities/subscription.entity").Subscription>;
    getMyEntitlements(req: any): Promise<{
        source: string;
        id: string;
        updated_at: Date;
        scope_type: import(".prisma/client").$Enums.EntitlementScopeType;
        scope_id: string;
        user_id: string;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        plan_type: import(".prisma/client").$Enums.PlanType;
        effective_at: Date;
        expires_at: Date | null;
    } | {
        source: string;
        planType: import(".prisma/client").$Enums.PlanType;
        limits: any;
        features: any;
    } | {
        source: string;
        planType: string;
        limits: {
            storageMb: number;
            projects: number;
            collaborators: number;
            canExport: boolean;
        };
        features: {};
    }>;
    getMyUsage(req: any, dto: UsageRangeDto): Promise<{
        range: "today" | "7d" | "30d";
        metrics: Record<string, {
            quantity: number;
            cost: number;
            count: number;
        }>;
        recentEvents: {
            id: string;
            environment: import(".prisma/client").$Enums.Environment;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            created_at: Date;
            scope_type: import(".prisma/client").$Enums.ScopeType;
            scope_id: string;
            user_id: string | null;
            occurred_at: Date;
            provider_code: string | null;
            endpoint: string | null;
            metric: string;
            quantity: number;
            approx_cost_usd: number | null;
            request_id: string | null;
        }[];
        totalCost: number;
    }>;
}
