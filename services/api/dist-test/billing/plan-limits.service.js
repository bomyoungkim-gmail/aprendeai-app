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
exports.PlanLimitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlanLimitsService = class PlanLimitsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.PLAN_LIMITS = {
            FREE: {
                highlightsPerMonth: 50,
                cornellNotesPerMonth: 10,
                contentsPerMonth: 5,
            },
            BASIC: {
                highlightsPerMonth: 500,
                cornellNotesPerMonth: 100,
                contentsPerMonth: 50,
            },
            PRO: {
                highlightsPerMonth: -1,
                cornellNotesPerMonth: -1,
                contentsPerMonth: -1,
            },
            ENTERPRISE: {
                highlightsPerMonth: -1,
                cornellNotesPerMonth: -1,
                contentsPerMonth: -1,
            },
        };
    }
    async getUserLimits(userId) {
        const subscription = await this.prisma.subscriptions.findFirst({
            where: {
                scope_type: "USER",
                scope_id: userId,
                status: "ACTIVE",
            },
        });
        if (subscription === null || subscription === void 0 ? void 0 : subscription.plan_id) {
            return this.PLAN_LIMITS.FREE;
        }
        return this.PLAN_LIMITS.FREE;
    }
    async checkQuota(userId, metric) {
        const limits = await this.getUserLimits(userId);
        const limitKey = `${metric}PerMonth`;
        const limit = limits[limitKey];
        if (limit === -1)
            return true;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const count = await this.getUsageCount(userId, metric, startOfMonth);
        return count < limit;
    }
    async getUsageCount(userId, metric, startDate) {
        switch (metric) {
            case "highlights":
                return this.prisma.highlights.count({
                    where: {
                        user_id: userId,
                        created_at: { gte: startDate },
                    },
                });
            case "cornellNotes":
                return this.prisma.cornell_notes.count({
                    where: {
                        user_id: userId,
                        created_at: { gte: startDate },
                    },
                });
            case "contents":
                return this.prisma.contents.count({
                    where: {
                        owner_user_id: userId,
                        created_at: { gte: startDate },
                    },
                });
            default:
                return 0;
        }
    }
    async getRemainingQuota(userId, metric) {
        const limits = await this.getUserLimits(userId);
        const limitKey = `${metric}PerMonth`;
        const limit = limits[limitKey];
        if (limit === -1)
            return -1;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const count = await this.getUsageCount(userId, metric, startOfMonth);
        return Math.max(0, limit - count);
    }
};
exports.PlanLimitsService = PlanLimitsService;
exports.PlanLimitsService = PlanLimitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlanLimitsService);
//# sourceMappingURL=plan-limits.service.js.map