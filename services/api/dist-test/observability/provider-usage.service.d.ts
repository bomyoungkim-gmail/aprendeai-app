import { PrismaService } from "../prisma/prisma.service";
export declare class ProviderUsageService {
    private prisma;
    constructor(prisma: PrismaService);
    trackUsage(data: {
        provider: string;
        operation: string;
        tokens?: number;
        promptTokens?: number;
        completionTokens?: number;
        cost?: number;
        costUsd?: number;
        latency?: number;
        statusCode?: number;
        userId?: string;
        familyId?: string;
        groupId?: string;
        institutionId?: string;
        feature?: string;
        metadata?: any;
    }): Promise<{
        provider: string;
        model: string | null;
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        institution_id: string | null;
        timestamp: Date;
        user_id: string | null;
        family_id: string | null;
        group_id: string | null;
        status_code: number | null;
        operation: string;
        tokens: number | null;
        latency: number | null;
        completion_tokens: number | null;
        cost_usd: number | null;
        feature: string;
        prompt_tokens: number | null;
        total_tokens: number | null;
    }>;
    getUsageStats(params: {
        provider?: string;
        from: Date;
        to: Date;
    }): Promise<{
        totalCalls: number;
        totalTokens: number;
        totalCost: number;
        avgLatency: number;
        avgCost: number;
    }>;
    getUsageByProvider(from: Date, to: Date): Promise<{
        provider: any;
        calls: any;
        tokens: any;
        cost: number;
        avgLatency: number;
    }[]>;
    getRecentCalls(provider?: string, limit?: number): Promise<{
        provider: string;
        model: string | null;
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        institution_id: string | null;
        timestamp: Date;
        user_id: string | null;
        family_id: string | null;
        group_id: string | null;
        status_code: number | null;
        operation: string;
        tokens: number | null;
        latency: number | null;
        completion_tokens: number | null;
        cost_usd: number | null;
        feature: string;
        prompt_tokens: number | null;
        total_tokens: number | null;
    }[]>;
    cleanupOldUsage(): Promise<number>;
}
