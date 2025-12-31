import { MetricsService } from "../observability/metrics.service";
import { ErrorTrackingService } from "../observability/error-tracking.service";
import { ProviderUsageService } from "../observability/provider-usage.service";
import { MetricsQueryDto, ErrorQueryDto, UsageQueryDto, OverviewQueryDto } from "./dto/dashboard.dto";
export declare class DashboardController {
    private metricsService;
    private errorService;
    private usageService;
    constructor(metricsService: MetricsService, errorService: ErrorTrackingService, usageService: ProviderUsageService);
    getOverview(query: OverviewQueryDto): Promise<{
        period: {
            from: Date;
            to: Date;
            hours: number;
        };
        requests: {
            total: number;
            count: number;
        };
        latency: {
            avg: number;
            max: number;
            min: number;
        };
        usage: {
            totalCalls: number;
            totalTokens: number;
            totalCost: number;
            avgLatency: number;
            avgCost: number;
        };
        errors: {
            total: number;
            unresolved: number;
            recent: {
                id: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                method: string | null;
                timestamp: Date;
                user_id: string | null;
                endpoint: string | null;
                request_id: string | null;
                message: string;
                stack: string | null;
                status_code: number | null;
                resolved: boolean;
            }[];
        };
    }>;
    getMetrics(query: MetricsQueryDto): Promise<{
        id: string;
        value: number;
        timestamp: Date;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        metric: string;
        bucket: string;
    }[]>;
    getMetricStats(metric: string, from: string, to: string): Promise<import(".prisma/client").Prisma.GetSystem_metricsAggregateType<{
        where: {
            metric: string;
            timestamp: {
                gte: Date;
                lte: Date;
            };
        };
        _count: true;
        _avg: {
            value: true;
        };
        _sum: {
            value: true;
        };
        _max: {
            value: true;
        };
        _min: {
            value: true;
        };
    }>>;
    getErrors(query: ErrorQueryDto): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }[]>;
    getErrorDetails(id: string): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }>;
    getErrorsByEndpoint(from: string, to: string): Promise<any[]>;
    markErrorResolved(id: string): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }>;
    getUsage(query: UsageQueryDto): Promise<{
        totalCalls: number;
        totalTokens: number;
        totalCost: number;
        avgLatency: number;
        avgCost: number;
    }>;
    getUsageByProvider(from: string, to: string): Promise<{
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
}
