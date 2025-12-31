import { PrismaService } from "../prisma/prisma.service";
import { MetricsService } from "./metrics.service";
import { ErrorTrackingService } from "./error-tracking.service";
import { ProviderUsageService } from "./provider-usage.service";
export declare class ObservabilityJobsService {
    private prisma;
    private metricsService;
    private errorService;
    private usageService;
    private readonly logger;
    constructor(prisma: PrismaService, metricsService: MetricsService, errorService: ErrorTrackingService, usageService: ProviderUsageService);
    aggregateHourlyMetrics(): Promise<void>;
    aggregateDailyMetrics(): Promise<void>;
    cleanupOldMetrics(): Promise<void>;
    cleanupOldErrors(): Promise<void>;
    cleanupOldUsage(): Promise<void>;
    private createJob;
    private completeJob;
    private failJob;
}
