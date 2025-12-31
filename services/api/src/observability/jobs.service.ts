import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { v4 as uuidv4 } from "uuid";
import { MetricsService } from "./metrics.service";
import { ErrorTrackingService } from "./error-tracking.service";
import { ProviderUsageService } from "./provider-usage.service";

@Injectable()
export class ObservabilityJobsService {
  private readonly logger = new Logger(ObservabilityJobsService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
    private errorService: ErrorTrackingService,
    private usageService: ProviderUsageService,
  ) {}

  /**
   * Aggregate 1-minute metrics into hourly buckets
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyMetrics() {
    const job = await this.createJob("aggregate_hourly_metrics");
    this.logger.log("Starting hourly metrics aggregation...");

    try {
      await this.metricsService.aggregateHourlyMetrics();
      await this.completeJob(job.id);
      this.logger.log("Hourly metrics aggregation completed");
    } catch (error) {
      await this.failJob(job.id, error.message);
      this.logger.error("Hourly metrics aggregation failed:", error);
    }
  }

  /**
   * Aggregate hourly metrics into daily buckets
   * Runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyMetrics() {
    const job = await this.createJob("aggregate_daily_metrics");
    this.logger.log("Starting daily metrics aggregation...");

    try {
      await this.metricsService.aggregateDailyMetrics();
      await this.completeJob(job.id);
      this.logger.log("Daily metrics aggregation completed");
    } catch (error) {
      await this.failJob(job.id, error.message);
      this.logger.error("Daily metrics aggregation failed:", error);
    }
  }

  /**
   * Cleanup old metrics (keep 90 days)
   * Runs weekly on Sunday at 2 AM
   */
  @Cron("0 2 * * 0")
  async cleanupOldMetrics() {
    const job = await this.createJob("cleanup_old_metrics");
    this.logger.log("Starting metrics cleanup...");

    try {
      const deleted = await this.metricsService.cleanupOldMetrics();
      await this.completeJob(job.id);
      this.logger.log(`Metrics cleanup completed. Deleted ${deleted} records.`);
    } catch (error) {
      await this.failJob(job.id, error.message);
      this.logger.error("Metrics cleanup failed:", error);
    }
  }

  /**
   * Cleanup old resolved errors (keep 30 days)
   * Runs daily at 3 AM
   */
  @Cron("0 3 * * *")
  async cleanupOldErrors() {
    const job = await this.createJob("cleanup_old_errors");
    this.logger.log("Starting error cleanup...");

    try {
      const deleted = await this.errorService.cleanupOldErrors();
      await this.completeJob(job.id);
      this.logger.log(`Error cleanup completed. Deleted ${deleted} records.`);
    } catch (error) {
      await this.failJob(job.id, error.message);
      this.logger.error("Error cleanup failed:", error);
    }
  }

  /**
   * Cleanup old provider usage (keep 180 days)
   * Runs weekly on Sunday at 4 AM
   */
  @Cron("0 4 * * 0")
  async cleanupOldUsage() {
    const job = await this.createJob("cleanup_old_usage");
    this.logger.log("Starting usage cleanup...");

    try {
      const deleted = await this.usageService.cleanupOldUsage();
      await this.completeJob(job.id);
      this.logger.log(`Usage cleanup completed. Deleted ${deleted} records.`);
    } catch (error) {
      await this.failJob(job.id, error.message);
      this.logger.error("Usage cleanup failed:", error);
    }
  }

  /**
   * Helper: Create background job record
   */
  private async createJob(name: string) {
    return this.prisma.background_jobs.create({
      data: {
        id: uuidv4(),
        job_name: name,
        status: "RUNNING",
        started_at: new Date(),
      },
    });
  }

  /**
   * Helper: Mark job as completed
   */
  private async completeJob(id: string) {
    const job = await this.prisma.background_jobs.findUnique({ where: { id } });
    if (!job) return;

    await this.prisma.background_jobs.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completed_at: new Date(),
        duration: Date.now() - job.started_at.getTime(),
      },
    });
  }

  /**
   * Helper: Mark job as failed
   */
  private async failJob(id: string, error: string) {
    await this.prisma.background_jobs.update({
      where: { id },
      data: {
        status: "FAILED",
        completed_at: new Date(),
        error: error.substring(0, 1000), // Limit error message length
      },
    });
  }
}
