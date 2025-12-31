import { PrismaService } from "../prisma/prisma.service";
import { ScopeType, Environment } from "@prisma/client";
export declare class UsageTrackingService {
    private prisma;
    constructor(prisma: PrismaService);
    trackUsage(data: {
        scopeType: ScopeType;
        scopeId: string;
        metric: string;
        quantity: number;
        environment: Environment;
        providerCode?: string;
        endpoint?: string;
        approxCostUsd?: number;
        requestId?: string;
        userId?: string;
        metadata?: any;
    }): Promise<{
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
    }>;
    getCurrentUsage(scopeType: ScopeType, scopeId: string, metric: string, range?: "today" | "7d" | "30d"): Promise<{
        metric: string;
        range: "today" | "7d" | "30d";
        totalQuantity: number;
        totalCost: number;
        eventCount: number;
    }>;
    getUsageStats(scopeType: ScopeType, scopeId: string, range?: "today" | "7d" | "30d"): Promise<{
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
    getUsageByProvider(scopeType: ScopeType, scopeId: string, range?: "today" | "7d" | "30d"): Promise<{
        provider: string;
        totalQuantity: number;
        totalCost: number;
        callCount: number;
    }[]>;
}
