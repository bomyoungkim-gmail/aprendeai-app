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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let MetricsService = class MetricsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordRequest(data) {
        try {
            await this.prisma.system_metrics.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    metric: "api_request",
                    value: 1,
                    tags: {
                        endpoint: data.endpoint,
                        method: data.method,
                        status: data.statusCode,
                    },
                    bucket: "1m",
                    timestamp: new Date(),
                },
            });
            await this.prisma.system_metrics.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    metric: "api_latency",
                    value: data.latency,
                    tags: { endpoint: data.endpoint },
                    bucket: "1m",
                    timestamp: new Date(),
                },
            });
        }
        catch (error) {
            console.error("Failed to record metrics:", error.message);
        }
    }
    async getMetrics(params) {
        return this.prisma.system_metrics.findMany({
            where: {
                metric: params.metric,
                bucket: params.bucket,
                timestamp: {
                    gte: params.from,
                    lte: params.to,
                },
            },
            orderBy: { timestamp: "asc" },
        });
    }
    async getStats(metric, from, to) {
        const result = await this.prisma.system_metrics.aggregate({
            where: {
                metric,
                timestamp: { gte: from, lte: to },
            },
            _count: true,
            _avg: { value: true },
            _sum: { value: true },
            _max: { value: true },
            _min: { value: true },
        });
        return result;
    }
    async aggregateHourlyMetrics() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const now = new Date();
        const minuteMetrics = await this.prisma.system_metrics.findMany({
            where: {
                bucket: "1m",
                timestamp: { gte: oneHourAgo, lte: now },
            },
        });
        const grouped = minuteMetrics.reduce((acc, m) => {
            const hour = new Date(m.timestamp);
            hour.setMinutes(0, 0, 0);
            const key = `${m.metric}-${hour.toISOString()}`;
            if (!acc[key]) {
                acc[key] = {
                    metric: m.metric,
                    values: [],
                    timestamp: hour,
                    tags: m.tags,
                };
            }
            acc[key].values.push(m.value);
            return acc;
        }, {});
        for (const groupObj of Object.values(grouped)) {
            const group = groupObj;
            const values = group.values;
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            await this.prisma.system_metrics.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    metric: group.metric,
                    value: avg,
                    tags: group.tags,
                    bucket: "1h",
                    timestamp: group.timestamp,
                },
            });
        }
    }
    async aggregateDailyMetrics() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const now = new Date();
        const hourlyMetrics = await this.prisma.system_metrics.findMany({
            where: {
                bucket: "1h",
                timestamp: { gte: oneDayAgo, lte: now },
            },
        });
        const grouped = hourlyMetrics.reduce((acc, m) => {
            const day = new Date(m.timestamp);
            day.setHours(0, 0, 0, 0);
            const key = `${m.metric}-${day.toISOString()}`;
            if (!acc[key]) {
                acc[key] = {
                    metric: m.metric,
                    values: [],
                    timestamp: day,
                    tags: m.tags,
                };
            }
            acc[key].values.push(m.value);
            return acc;
        }, {});
        for (const groupObj of Object.values(grouped)) {
            const group = groupObj;
            const values = group.values;
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            await this.prisma.system_metrics.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    metric: group.metric,
                    value: avg,
                    tags: group.tags,
                    bucket: "1d",
                    timestamp: group.timestamp,
                },
            });
        }
    }
    async cleanupOldMetrics() {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const result = await this.prisma.system_metrics.deleteMany({
            where: { timestamp: { lt: cutoff } },
        });
        return result.count;
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map