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
exports.TokenAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TokenAnalyticsService = class TokenAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAggregatedMetrics(from, to) {
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
    async getEvolution(from, to, interval = "day") {
        const intervalSql = interval === "hour" ? "hour" : "day";
        const series = await this.prisma.$queryRaw `
      SELECT 
        DATE_TRUNC(${client_1.Prisma.sql `${intervalSql}`}, timestamp) as date,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM provider_usage
      WHERE timestamp >= ${from} AND timestamp <= ${to}
      GROUP BY DATE_TRUNC(${client_1.Prisma.sql `${intervalSql}`}, timestamp)
      ORDER BY date ASC
    `;
        return series.map((row) => ({
            date: row.date,
            requests: Number(row.requests),
            tokens: Number(row.tokens || 0),
            cost: Number(row.cost || 0),
        }));
    }
    async getDistribution(dimension, from, to) {
        const validDimensions = ["provider", "model", "feature", "operation"];
        if (!validDimensions.includes(dimension)) {
            throw new Error(`Invalid dimension: ${dimension}`);
        }
        const groupByResult = await this.prisma.provider_usage.groupBy({
            by: [dimension],
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
        });
        return groupByResult.map((g) => ({
            key: g[dimension],
            requests: g._count.id,
            tokens: g._sum.total_tokens || 0,
            cost: g._sum.cost_usd || 0,
        }));
    }
    async getTopConsumers(entity, from, to, limit = 10) {
        const colMap = {
            user: "user_id",
            family: "family_id",
            institution: "institution_id",
        };
        const colName = colMap[entity];
        if (!colName)
            throw new Error("Invalid entity type");
        const result = await this.prisma.$queryRaw `
      SELECT 
        ${client_1.Prisma.sql([colName])} as id,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM provider_usage
      WHERE timestamp >= ${from} AND timestamp <= ${to} AND ${client_1.Prisma.sql([colName])} IS NOT NULL
      GROUP BY ${client_1.Prisma.sql([colName])}
      ORDER BY cost DESC
      LIMIT ${limit}
    `;
        return result.map((row) => ({
            id: row.id,
            requests: Number(row.requests),
            tokens: Number(row.tokens || 0),
            cost: Number(row.cost || 0),
        }));
    }
};
exports.TokenAnalyticsService = TokenAnalyticsService;
exports.TokenAnalyticsService = TokenAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokenAnalyticsService);
const client_1 = require("@prisma/client");
//# sourceMappingURL=token-analytics.service.js.map