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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const plan_limits_service_1 = require("../../billing/plan-limits.service");
let QuotaGuard = class QuotaGuard {
    constructor(planLimits, reflector) {
        this.planLimits = planLimits;
        this.reflector = reflector;
    }
    async canActivate(context) {
        var _a;
        const metric = this.reflector.get("quota_metric", context.getHandler());
        if (!metric)
            return true;
        const request = context.switchToHttp().getRequest();
        const userId = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return false;
        const hasQuota = await this.planLimits.checkQuota(userId, metric);
        if (!hasQuota) {
            const remaining = await this.planLimits.getRemainingQuota(userId, metric);
            const limits = await this.planLimits.getUserLimits(userId);
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: `Monthly quota exceeded for ${metric}`,
                error: "QUOTA_EXCEEDED",
                metric,
                remaining,
                limit: limits[`${metric}PerMonth`],
                upgradeUrl: "/pricing",
            });
        }
        return true;
    }
};
exports.QuotaGuard = QuotaGuard;
exports.QuotaGuard = QuotaGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [plan_limits_service_1.PlanLimitsService,
        core_1.Reflector])
], QuotaGuard);
//# sourceMappingURL=quota.guard.js.map