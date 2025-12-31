import { TokenAnalyticsService } from "../analytics/token-analytics.service";
export declare class AiAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: TokenAnalyticsService);
    getOverview(fromStr?: string, toStr?: string): Promise<{
        totalRequests: number;
        totalTokens: number;
        totalCostUsd: number;
        avgLatency: number;
    }>;
    getEvolution(fromStr?: string, toStr?: string, interval?: "day" | "hour"): Promise<{
        date: any;
        requests: number;
        tokens: number;
        cost: number;
    }[]>;
    getDistribution(dimension: "provider" | "model" | "feature" | "operation", fromStr?: string, toStr?: string): Promise<{
        key: any;
        requests: number;
        tokens: number;
        cost: number;
    }[]>;
    getTopConsumers(entity: "user" | "family" | "institution", limit?: number, fromStr?: string, toStr?: string): Promise<{
        id: any;
        requests: number;
        tokens: number;
        cost: number;
    }[]>;
    private parseDateRange;
}
