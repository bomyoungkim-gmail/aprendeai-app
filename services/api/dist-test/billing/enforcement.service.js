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
exports.EnforcementService = exports.FeatureDisabledException = exports.LimitExceededException = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const entitlements_service_1 = require("./entitlements.service");
class LimitExceededException extends common_1.HttpException {
    constructor(data) {
        super(Object.assign({ statusCode: 429, error: "Too Many Requests", message: `Limit exceeded for ${data.metric}`, code: "LIMIT_EXCEEDED" }, data), common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.LimitExceededException = LimitExceededException;
class FeatureDisabledException extends common_1.HttpException {
    constructor(feature) {
        super({
            statusCode: 403,
            error: "Forbidden",
            message: `Feature '${feature}' is not enabled in your plan`,
            code: "FEATURE_DISABLED",
            feature,
            upgradeHint: true,
        }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.FeatureDisabledException = FeatureDisabledException;
let EnforcementService = class EnforcementService {
    constructor(prisma, entitlementsService) {
        this.prisma = prisma;
        this.entitlementsService = entitlementsService;
    }
    async requireFeature(scopeType, scopeId, featureKey, environment) {
        const entitlements = await this.entitlementsService.resolve(scopeType, scopeId, environment);
        const enabled = entitlements.features[featureKey];
        if (!enabled) {
            throw new FeatureDisabledException(featureKey);
        }
        return true;
    }
    async enforceLimit(scopeType, scopeId, metric, quantity, environment) {
        const entitlements = await this.entitlementsService.resolve(scopeType, scopeId, environment);
        const limit = entitlements.limits[metric];
        if (limit === undefined) {
            return;
        }
        if (limit === -1) {
            return;
        }
        const current = await this.getCurrentUsage(scopeType, scopeId, metric, environment);
        if (current + quantity > limit) {
            throw new LimitExceededException({
                metric,
                limit,
                current,
                upgradeHint: true,
            });
        }
        return true;
    }
    async getCurrentUsage(scopeType, scopeId, metric, environment) {
        let startDate;
        if (metric.endsWith("_per_day")) {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        }
        else if (metric.endsWith("_per_month")) {
            startDate = new Date();
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }
        else {
            startDate = new Date(0);
        }
        const result = await this.prisma.usage_events.aggregate({
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                metric: metric.replace("_per_day", "").replace("_per_month", ""),
                environment,
                occurred_at: {
                    gte: startDate,
                },
            },
            _sum: {
                quantity: true,
            },
        });
        return result._sum.quantity || 0;
    }
    async wouldExceedLimit(scopeType, scopeId, metric, quantity, environment) {
        try {
            await this.enforceLimit(scopeType, scopeId, metric, quantity, environment);
            const current = await this.getCurrentUsage(scopeType, scopeId, metric, environment);
            const entitlements = await this.entitlementsService.resolve(scopeType, scopeId, environment);
            return {
                exceeded: false,
                current,
                limit: entitlements.limits[metric] || -1,
            };
        }
        catch (error) {
            if (error instanceof LimitExceededException) {
                return {
                    exceeded: true,
                    current: error.getResponse().current,
                    limit: error.getResponse().limit,
                };
            }
            throw error;
        }
    }
    async enforceHierarchy(hierarchy, metric, quantity, environment) {
        let lastError;
        for (const scope of hierarchy) {
            try {
                await this.enforceLimit(scope.scopeType, scope.scopeId, metric, quantity, environment);
                return scope;
            }
            catch (error) {
                lastError = error;
            }
        }
        throw (lastError || new LimitExceededException({ metric, limit: 0, current: 0 }));
    }
    async requireFeatureHierarchy(hierarchy, featureKey, environment) {
        let lastError;
        for (const scope of hierarchy) {
            try {
                await this.requireFeature(scope.scopeType, scope.scopeId, featureKey, environment);
                return scope;
            }
            catch (error) {
                lastError = error;
            }
        }
        throw lastError || new FeatureDisabledException(featureKey);
    }
};
exports.EnforcementService = EnforcementService;
exports.EnforcementService = EnforcementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        entitlements_service_1.EntitlementsService])
], EnforcementService);
//# sourceMappingURL=enforcement.service.js.map