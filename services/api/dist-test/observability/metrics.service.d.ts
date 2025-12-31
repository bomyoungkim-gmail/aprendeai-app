import { PrismaService } from "../prisma/prisma.service";
export declare class MetricsService {
    private prisma;
    constructor(prisma: PrismaService);
    recordRequest(data: {
        endpoint: string;
        method: string;
        statusCode: number;
        latency: number;
        userId?: string;
    }): Promise<void>;
    getMetrics(params: {
        metric: string;
        from: Date;
        to: Date;
        bucket: string;
    }): Promise<{
        id: string;
        value: number;
        timestamp: Date;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        metric: string;
        bucket: string;
    }[]>;
    getStats(metric: string, from: Date, to: Date): Promise<import(".prisma/client").Prisma.GetSystem_metricsAggregateType<{
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
    aggregateHourlyMetrics(): Promise<void>;
    aggregateDailyMetrics(): Promise<void>;
    cleanupOldMetrics(): Promise<number>;
}
