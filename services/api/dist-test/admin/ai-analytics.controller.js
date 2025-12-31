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
exports.AiAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const client_1 = require("@prisma/client");
const token_analytics_service_1 = require("../analytics/token-analytics.service");
let AiAnalyticsController = class AiAnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getOverview(fromStr, toStr) {
        const { from, to } = this.parseDateRange(fromStr, toStr);
        return this.analyticsService.getAggregatedMetrics(from, to);
    }
    async getEvolution(fromStr, toStr, interval = "day") {
        const { from, to } = this.parseDateRange(fromStr, toStr);
        return this.analyticsService.getEvolution(from, to, interval);
    }
    async getDistribution(dimension, fromStr, toStr) {
        const { from, to } = this.parseDateRange(fromStr, toStr);
        return this.analyticsService.getDistribution(dimension, from, to);
    }
    async getTopConsumers(entity, limit = 10, fromStr, toStr) {
        const { from, to } = this.parseDateRange(fromStr, toStr);
        return this.analyticsService.getTopConsumers(entity, from, to, limit);
    }
    parseDateRange(fromStr, toStr) {
        const to = toStr ? new Date(toStr) : new Date();
        const from = fromStr
            ? new Date(fromStr)
            : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from, to };
    }
};
exports.AiAnalyticsController = AiAnalyticsController;
__decorate([
    (0, common_1.Get)("overview"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get aggregated AI usage metrics" }),
    __param(0, (0, common_1.Query)("from")),
    __param(1, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)("evolution"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get AI usage evolution over time" }),
    (0, swagger_1.ApiQuery)({ name: "interval", enum: ["day", "hour"], required: false }),
    __param(0, (0, common_1.Query)("from")),
    __param(1, (0, common_1.Query)("to")),
    __param(2, (0, common_1.Query)("interval")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getEvolution", null);
__decorate([
    (0, common_1.Get)("distribution"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get AI usage distribution by dimension" }),
    (0, swagger_1.ApiQuery)({
        name: "dimension",
        enum: ["provider", "model", "feature", "operation"],
    }),
    __param(0, (0, common_1.Query)("dimension")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getDistribution", null);
__decorate([
    (0, common_1.Get)("top-consumers"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Identify top AI consumers" }),
    (0, swagger_1.ApiQuery)({ name: "entity", enum: ["user", "family", "institution"] }),
    __param(0, (0, common_1.Query)("entity")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("from")),
    __param(3, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String]),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getTopConsumers", null);
exports.AiAnalyticsController = AiAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("admin-analytics"),
    (0, common_1.Controller)("admin/ai"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [token_analytics_service_1.TokenAnalyticsService])
], AiAnalyticsController);
//# sourceMappingURL=ai-analytics.controller.js.map