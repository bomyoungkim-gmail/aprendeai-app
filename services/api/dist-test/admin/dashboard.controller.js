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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const metrics_service_1 = require("../observability/metrics.service");
const error_tracking_service_1 = require("../observability/error-tracking.service");
const provider_usage_service_1 = require("../observability/provider-usage.service");
const dashboard_dto_1 = require("./dto/dashboard.dto");
let DashboardController = class DashboardController {
    constructor(metricsService, errorService, usageService) {
        this.metricsService = metricsService;
        this.errorService = errorService;
        this.usageService = usageService;
    }
    async getOverview(query) {
        const hours = query.hours || 24;
        const from = new Date(Date.now() - hours * 60 * 60 * 1000);
        const to = new Date();
        const [requestStats, errorStats, usageStats, recentErrors] = await Promise.all([
            this.metricsService.getStats("api_request", from, to),
            this.metricsService.getStats("api_latency", from, to),
            this.usageService.getUsageStats({ from, to }),
            this.errorService.getErrors({ from, to, resolved: false, limit: 10 }),
        ]);
        return {
            period: { from, to, hours },
            requests: {
                total: requestStats._sum.value || 0,
                count: requestStats._count || 0,
            },
            latency: {
                avg: Math.round(errorStats._avg.value || 0),
                max: Math.round(errorStats._max.value || 0),
                min: Math.round(errorStats._min.value || 0),
            },
            usage: usageStats,
            errors: {
                total: recentErrors.length,
                unresolved: recentErrors.filter((e) => !e.resolved).length,
                recent: recentErrors.slice(0, 5),
            },
        };
    }
    async getMetrics(query) {
        const from = new Date(query.from);
        const to = new Date(query.to);
        return this.metricsService.getMetrics({
            metric: query.metric,
            from,
            to,
            bucket: query.bucket,
        });
    }
    async getMetricStats(metric, from, to) {
        return this.metricsService.getStats(metric, new Date(from), new Date(to));
    }
    async getErrors(query) {
        const filters = {};
        if (query.from)
            filters.from = new Date(query.from);
        if (query.to)
            filters.to = new Date(query.to);
        if (query.resolved !== undefined)
            filters.resolved = query.resolved;
        if (query.endpoint)
            filters.endpoint = query.endpoint;
        if (query.limit)
            filters.limit = query.limit;
        return this.errorService.getErrors(filters);
    }
    async getErrorDetails(id) {
        return this.errorService.getErrorDetails(id);
    }
    async getErrorsByEndpoint(from, to) {
        return this.errorService.getErrorsByEndpoint(new Date(from), new Date(to));
    }
    async markErrorResolved(id) {
        return this.errorService.markResolved(id);
    }
    async getUsage(query) {
        return this.usageService.getUsageStats({
            provider: query.provider,
            from: new Date(query.from),
            to: new Date(query.to),
        });
    }
    async getUsageByProvider(from, to) {
        return this.usageService.getUsageByProvider(new Date(from), new Date(to));
    }
    async getRecentCalls(provider, limit) {
        return this.usageService.getRecentCalls(provider, limit ? Number(limit) : 50);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)("overview"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get dashboard overview (last 24h by default)" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_dto_1.OverviewQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)("metrics"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get time-series metrics" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_dto_1.MetricsQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)("metrics/stats"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get aggregated metric stats" }),
    __param(0, (0, common_1.Query)("metric")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetricStats", null);
__decorate([
    (0, common_1.Get)("errors"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get error logs" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_dto_1.ErrorQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getErrors", null);
__decorate([
    (0, common_1.Get)("errors/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get error details" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getErrorDetails", null);
__decorate([
    (0, common_1.Get)("errors/by-endpoint"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get errors grouped by endpoint" }),
    __param(0, (0, common_1.Query)("from")),
    __param(1, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getErrorsByEndpoint", null);
__decorate([
    (0, common_1.Put)("errors/:id/resolve"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Mark error as resolved" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "markErrorResolved", null);
__decorate([
    (0, common_1.Get)("usage"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get provider usage stats" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_dto_1.UsageQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getUsage", null);
__decorate([
    (0, common_1.Get)("usage/by-provider"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get usage breakdown by provider" }),
    __param(0, (0, common_1.Query)("from")),
    __param(1, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getUsageByProvider", null);
__decorate([
    (0, common_1.Get)("usage/recent"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get recent provider calls" }),
    __param(0, (0, common_1.Query)("provider")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRecentCalls", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)("admin-dashboard"),
    (0, common_1.Controller)("admin/dashboard"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService,
        error_tracking_service_1.ErrorTrackingService,
        provider_usage_service_1.ProviderUsageService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map