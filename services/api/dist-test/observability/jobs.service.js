"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ObservabilityJobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityJobsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
const metrics_service_1 = require("./metrics.service");
const error_tracking_service_1 = require("./error-tracking.service");
const provider_usage_service_1 = require("./provider-usage.service");
let ObservabilityJobsService = ObservabilityJobsService_1 = class ObservabilityJobsService {
    constructor(prisma, metricsService, errorService, usageService) {
        this.prisma = prisma;
        this.metricsService = metricsService;
        this.errorService = errorService;
        this.usageService = usageService;
        this.logger = new common_1.Logger(ObservabilityJobsService_1.name);
    }
    async aggregateHourlyMetrics() {
        const job = await this.createJob("aggregate_hourly_metrics");
        this.logger.log("Starting hourly metrics aggregation...");
        try {
            await this.metricsService.aggregateHourlyMetrics();
            await this.completeJob(job.id);
            this.logger.log("Hourly metrics aggregation completed");
        }
        catch (error) {
            await this.failJob(job.id, error.message);
            this.logger.error("Hourly metrics aggregation failed:", error);
        }
    }
    async aggregateDailyMetrics() {
        const job = await this.createJob("aggregate_daily_metrics");
        this.logger.log("Starting daily metrics aggregation...");
        try {
            await this.metricsService.aggregateDailyMetrics();
            await this.completeJob(job.id);
            this.logger.log("Daily metrics aggregation completed");
        }
        catch (error) {
            await this.failJob(job.id, error.message);
            this.logger.error("Daily metrics aggregation failed:", error);
        }
    }
    async cleanupOldMetrics() {
        const job = await this.createJob("cleanup_old_metrics");
        this.logger.log("Starting metrics cleanup...");
        try {
            const deleted = await this.metricsService.cleanupOldMetrics();
            await this.completeJob(job.id);
            this.logger.log(`Metrics cleanup completed. Deleted ${deleted} records.`);
        }
        catch (error) {
            await this.failJob(job.id, error.message);
            this.logger.error("Metrics cleanup failed:", error);
        }
    }
    async cleanupOldErrors() {
        const job = await this.createJob("cleanup_old_errors");
        this.logger.log("Starting error cleanup...");
        try {
            const deleted = await this.errorService.cleanupOldErrors();
            await this.completeJob(job.id);
            this.logger.log(`Error cleanup completed. Deleted ${deleted} records.`);
        }
        catch (error) {
            await this.failJob(job.id, error.message);
            this.logger.error("Error cleanup failed:", error);
        }
    }
    async cleanupOldUsage() {
        const job = await this.createJob("cleanup_old_usage");
        this.logger.log("Starting usage cleanup...");
        try {
            const deleted = await this.usageService.cleanupOldUsage();
            await this.completeJob(job.id);
            this.logger.log(`Usage cleanup completed. Deleted ${deleted} records.`);
        }
        catch (error) {
            await this.failJob(job.id, error.message);
            this.logger.error("Usage cleanup failed:", error);
        }
    }
    async createJob(name) {
        return this.prisma.background_jobs.create({
            data: {
                id: (0, uuid_1.v4)(),
                job_name: name,
                status: "RUNNING",
                started_at: new Date(),
            },
        });
    }
    async completeJob(id) {
        const job = await this.prisma.background_jobs.findUnique({ where: { id } });
        if (!job)
            return;
        await this.prisma.background_jobs.update({
            where: { id },
            data: {
                status: "COMPLETED",
                completed_at: new Date(),
                duration: Date.now() - job.started_at.getTime(),
            },
        });
    }
    async failJob(id, error) {
        await this.prisma.background_jobs.update({
            where: { id },
            data: {
                status: "FAILED",
                completed_at: new Date(),
                error: error.substring(0, 1000),
            },
        });
    }
};
exports.ObservabilityJobsService = ObservabilityJobsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservabilityJobsService.prototype, "aggregateHourlyMetrics", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservabilityJobsService.prototype, "aggregateDailyMetrics", null);
__decorate([
    (0, schedule_1.Cron)("0 2 * * 0"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservabilityJobsService.prototype, "cleanupOldMetrics", null);
__decorate([
    (0, schedule_1.Cron)("0 3 * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservabilityJobsService.prototype, "cleanupOldErrors", null);
__decorate([
    (0, schedule_1.Cron)("0 4 * * 0"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservabilityJobsService.prototype, "cleanupOldUsage", null);
exports.ObservabilityJobsService = ObservabilityJobsService = ObservabilityJobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        metrics_service_1.MetricsService,
        error_tracking_service_1.ErrorTrackingService,
        provider_usage_service_1.ProviderUsageService])
], ObservabilityJobsService);
//# sourceMappingURL=jobs.service.js.map