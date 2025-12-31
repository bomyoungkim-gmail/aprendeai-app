import { ScopeType, SubscriptionStatus } from "@prisma/client";
export declare class CreatePlanDto {
    code: string;
    name: string;
    description?: string;
    entitlements: any;
    monthlyPrice?: number;
    yearlyPrice?: number;
}
export declare class UpdatePlanDto {
    name?: string;
    description?: string;
    entitlements?: any;
    monthlyPrice?: number;
    yearlyPrice?: number;
    isActive?: boolean;
}
export declare class AssignPlanDto {
    scopeType: ScopeType;
    scopeId: string;
    planCode: string;
    reason: string;
}
export declare class CancelSubscriptionDto {
    subscriptionId: string;
    cancelAtPeriodEnd?: boolean;
    reason: string;
}
export declare class SubscriptionFilterDto {
    scopeType?: ScopeType;
    scopeId?: string;
    status?: SubscriptionStatus;
    planId?: string;
}
export declare class PreviewEntitlementsDto {
    scopeType: ScopeType;
    scopeId: string;
}
export declare class SetOverridesDto {
    scopeType: ScopeType;
    scopeId: string;
    overrides: any;
    reason: string;
}
export declare class UsageRangeDto {
    range?: "today" | "7d" | "30d";
}
