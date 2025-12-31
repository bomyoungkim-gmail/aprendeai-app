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
exports.GetAggregatedMetricsUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let GetAggregatedMetricsUseCase = class GetAggregatedMetricsUseCase {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(from, to) {
        const aggregations = await this.prisma.provider_usage.aggregate({
            where: {
                timestamp: { gte: from, lte: to },
            },
            _sum: {
                total_tokens: true,
                cost_usd: true,
            },
            _count: {
                id: true,
            },
            _avg: {
                latency: true,
            },
        });
        return {
            totalRequests: aggregations._count.id,
            totalTokens: aggregations._sum.total_tokens || 0,
            totalCostUsd: aggregations._sum.cost_usd || 0,
            avgLatency: aggregations._avg.latency || 0,
        };
    }
};
exports.GetAggregatedMetricsUseCase = GetAggregatedMetricsUseCase;
exports.GetAggregatedMetricsUseCase = GetAggregatedMetricsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GetAggregatedMetricsUseCase);
//# sourceMappingURL=get-aggregated-metrics.use-case.js.map