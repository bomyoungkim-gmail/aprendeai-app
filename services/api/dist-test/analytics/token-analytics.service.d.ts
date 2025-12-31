import { PrismaService } from "../prisma/prisma.service";
export declare class TokenAnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAggregatedMetrics(from: Date, to: Date): Promise<{
        totalRequests: number;
        totalTokens: number;
        totalCostUsd: number;
        avgLatency: number;
    }>;
    getEvolution(from: Date, to: Date, interval?: "day" | "hour"): Promise<{
        date: any;
        requests: number;
        tokens: number;
        cost: number;
    }[]>;
    getDistribution(dimension: "provider" | "model" | "feature" | "operation", from: Date, to: Date): Promise<{
        key: any;
        requests: number;
        tokens: number;
        cost: number;
    }[]>;
    getTopConsumers(entity: "user" | "family" | "institution", from: Date, to: Date, limit?: number): Promise<{
        id: any;
        requests: number;
        tokens: number;
        cost: number;
    }[]>;
}
