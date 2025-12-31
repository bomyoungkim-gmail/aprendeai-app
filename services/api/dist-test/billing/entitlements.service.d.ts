import { PrismaService } from "../prisma/prisma.service";
import { PlanType, EntitlementScopeType } from "@prisma/client";
import { SubscriptionService } from "./subscription.service";
export declare const FREE_LIMITS: {
    storageMb: number;
    projects: number;
    collaborators: number;
    canExport: boolean;
};
export declare class EntitlementsService {
    private prisma;
    private subscriptionService;
    private readonly logger;
    constructor(prisma: PrismaService, subscriptionService: SubscriptionService);
    computeEntitlements(userId: string): Promise<{
        source: string;
        planType: PlanType;
        limits: any;
        features: any;
    }>;
    resolve(scopeType: string, scopeId: string, environment?: string): Promise<{
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
    getEntitlement(userId: string, scopeType?: EntitlementScopeType, scopeId?: string): any;
    resolveUser(userId: string): Promise<{
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
    }>;
    setOverrides(scopeType: string, scopeId: string, overrides: any, reason: string, adminUserId: string): Promise<any>;
    removeOverrides(scopeType: string, scopeId: string): Promise<void>;
    getOverrides(scopeType: string, scopeId: string): Promise<any>;
    refreshSnapshot(userId: string): Promise<{
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
    }>;
    forceRefreshForScope(scopeType: EntitlementScopeType, scopeId: string): Promise<void>;
}
