import { BillingService } from "./billing.service";
import { SubscriptionService } from "./subscription.service";
import { EntitlementsService } from "./entitlements.service";
import { AdminService } from "../admin/admin.service";
import { CreatePlanDto, UpdatePlanDto, AssignPlanDto, CancelSubscriptionDto, SubscriptionFilterDto, PreviewEntitlementsDto, SetOverridesDto } from "./dto/billing.dto";
export declare class BillingController {
    private billingService;
    private subscriptionService;
    private entitlementsService;
    private adminService;
    constructor(billingService: BillingService, subscriptionService: SubscriptionService, entitlementsService: EntitlementsService, adminService: AdminService);
    getPlans(): Promise<import("./domain/entities/plan.entity").Plan[]>;
    createPlan(dto: CreatePlanDto, req: any): Promise<import("./domain/entities/plan.entity").Plan>;
    updatePlan(id: string, dto: UpdatePlanDto, req: any): Promise<import("./domain/entities/plan.entity").Plan>;
    deletePlan(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getSubscriptions(filters: SubscriptionFilterDto): Promise<import("./domain/entities/subscription.entity").Subscription[]>;
    getSubscription(id: string): Promise<import("./domain/entities/subscription.entity").Subscription>;
    assignPlan(dto: AssignPlanDto, req: any): Promise<import("./domain/entities/subscription.entity").Subscription>;
    cancelSubscription(dto: CancelSubscriptionDto, req: any): Promise<{
        success: boolean;
        status: string;
    }>;
    previewEntitlements(dto: PreviewEntitlementsDto): Promise<{
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
    setOverrides(dto: SetOverridesDto, req: any): Promise<any>;
    removeOverrides(scopeType: string, scopeId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
