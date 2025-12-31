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
exports.ProviderUsageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let ProviderUsageService = class ProviderUsageService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trackUsage(data) {
        var _a;
        try {
            return await this.prisma.provider_usage.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    provider: data.provider,
                    model: ((_a = data.metadata) === null || _a === void 0 ? void 0 : _a.model) || null,
                    operation: data.operation,
                    tokens: data.tokens,
                    prompt_tokens: data.promptTokens,
                    completion_tokens: data.completionTokens,
                    total_tokens: data.tokens,
                    cost_usd: data.costUsd,
                    latency: data.latency,
                    status_code: data.statusCode,
                    user_id: data.userId,
                    family_id: data.familyId,
                    group_id: data.groupId,
                    institution_id: data.institutionId,
                    feature: data.feature || "unknown",
                    metadata: data.metadata,
                    timestamp: new Date(),
                },
            });
        }
        catch (error) {
            console.error("Failed to track provider usage:", error);
        }
    }
    async getUsageStats(params) {
        const where = {
            timestamp: { gte: params.from, lte: params.to },
        };
        if (params.provider) {
            where.provider = params.provider;
        }
        const stats = await this.prisma.provider_usage.aggregate({
            where,
            _sum: { tokens: true, cost_usd: true },
            _count: true,
            _avg: { latency: true, cost_usd: true },
        });
        return {
            totalCalls: stats._count,
            totalTokens: stats._sum.tokens || 0,
            totalCost: stats._sum.cost_usd || 0,
            avgLatency: stats._avg.latency || 0,
            avgCost: stats._avg.cost_usd || 0,
        };
    }
    async getUsageByProvider(from, to) {
        const usage = await this.prisma.provider_usage.findMany({
            where: {
                timestamp: { gte: from, lte: to },
            },
            select: {
                provider: true,
                operation: true,
                tokens: true,
                cost_usd: true,
                latency: true,
            },
        });
        const grouped = usage.reduce((acc, u) => {
            if (!acc[u.provider]) {
                acc[u.provider] = {
                    provider: u.provider,
                    calls: 0,
                    tokens: 0,
                    cost: 0,
                    latency: [],
                };
            }
            acc[u.provider].calls++;
            acc[u.provider].tokens += u.tokens || 0;
            acc[u.provider].cost += u.cost_usd || 0;
            if (u.latency)
                acc[u.provider].latency.push(u.latency);
            return acc;
        }, {});
        return Object.values(grouped).map((g) => ({
            provider: g.provider,
            calls: g.calls,
            tokens: g.tokens,
            cost: Number(g.cost.toFixed(4)),
            avgLatency: g.latency.length > 0
                ? Math.round(g.latency.reduce((a, b) => a + b, 0) /
                    g.latency.length)
                : 0,
        }));
    }
    async getRecentCalls(provider, limit = 50) {
        return this.prisma.provider_usage.findMany({
            where: provider ? { provider } : undefined,
            orderBy: { timestamp: "desc" },
            take: limit,
        });
    }
    async cleanupOldUsage() {
        const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const result = await this.prisma.provider_usage.deleteMany({
            where: { timestamp: { lt: cutoff } },
        });
        return result.count;
    }
};
exports.ProviderUsageService = ProviderUsageService;
exports.ProviderUsageService = ProviderUsageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProviderUsageService);
//# sourceMappingURL=provider-usage.service.js.map