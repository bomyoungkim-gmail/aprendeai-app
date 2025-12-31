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
exports.UsageTrackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsageTrackingService = class UsageTrackingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trackUsage(data) {
        const { v4: uuidv4 } = require("uuid");
        return this.prisma.usage_events.create({
            data: {
                id: uuidv4(),
                scope_type: data.scopeType,
                scope_id: data.scopeId,
                metric: data.metric,
                quantity: data.quantity,
                environment: data.environment,
                provider_code: data.providerCode,
                endpoint: data.endpoint,
                approx_cost_usd: data.approxCostUsd,
                request_id: data.requestId,
                user_id: data.userId,
                metadata: data.metadata,
                occurred_at: new Date(),
            },
        });
    }
    async getCurrentUsage(scopeType, scopeId, metric, range = "today") {
        const now = new Date();
        let startDate;
        switch (range) {
            case "today":
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case "7d":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case "30d":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                break;
        }
        const result = await this.prisma.usage_events.aggregate({
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                metric,
                occurred_at: {
                    gte: startDate,
                },
            },
            _sum: {
                quantity: true,
                approx_cost_usd: true,
            },
            _count: true,
        });
        return {
            metric,
            range,
            totalQuantity: result._sum.quantity || 0,
            totalCost: result._sum.approx_cost_usd || 0,
            eventCount: result._count,
        };
    }
    async getUsageStats(scopeType, scopeId, range = "today") {
        const now = new Date();
        let startDate;
        switch (range) {
            case "today":
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case "7d":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case "30d":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                break;
        }
        const events = await this.prisma.usage_events.findMany({
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                occurred_at: {
                    gte: startDate,
                },
            },
            orderBy: {
                occurred_at: "desc",
            },
            take: 100,
        });
        const byMetric = {};
        events.forEach((event) => {
            if (!byMetric[event.metric]) {
                byMetric[event.metric] = { quantity: 0, cost: 0, count: 0 };
            }
            byMetric[event.metric].quantity += event.quantity;
            byMetric[event.metric].cost += event.approx_cost_usd || 0;
            byMetric[event.metric].count++;
        });
        return {
            range,
            metrics: byMetric,
            recentEvents: events.slice(0, 10),
            totalCost: events.reduce((sum, e) => sum + (e.approx_cost_usd || 0), 0),
        };
    }
    async getUsageByProvider(scopeType, scopeId, range = "30d") {
        const now = new Date();
        let startDate;
        switch (range) {
            case "today":
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case "7d":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case "30d":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                break;
        }
        const events = await this.prisma.usage_events.groupBy({
            by: ["provider_code"],
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                occurred_at: {
                    gte: startDate,
                },
                provider_code: {
                    not: null,
                },
            },
            _sum: {
                quantity: true,
                approx_cost_usd: true,
            },
            _count: true,
        });
        return events.map((e) => ({
            provider: e.provider_code,
            totalQuantity: e._sum.quantity || 0,
            totalCost: e._sum.approx_cost_usd || 0,
            callCount: e._count,
        }));
    }
};
exports.UsageTrackingService = UsageTrackingService;
exports.UsageTrackingService = UsageTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsageTrackingService);
//# sourceMappingURL=usage-tracking.service.js.map