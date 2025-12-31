import { PrismaService } from "../../../prisma/prisma.service";
export declare class GetAggregatedMetricsUseCase {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute(from: Date, to: Date): Promise<{
        totalRequests: number;
        totalTokens: number;
        totalCostUsd: number;
        avgLatency: number;
    }>;
}
