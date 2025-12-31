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
exports.ErrorTrackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let ErrorTrackingService = class ErrorTrackingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logError(data) {
        try {
            return await this.prisma.error_logs.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    message: data.message,
                    stack: data.stack,
                    endpoint: data.endpoint,
                    method: data.method,
                    status_code: data.statusCode,
                    user_id: data.userId,
                    request_id: data.requestId,
                    metadata: data.metadata,
                    timestamp: new Date(),
                    resolved: false,
                },
            });
        }
        catch (error) {
            console.error("Failed to log error to DB:", error);
            console.error("Original error:", data);
        }
    }
    async getErrors(filters) {
        const where = {};
        if (filters.from || filters.to) {
            where.timestamp = {};
            if (filters.from)
                where.timestamp.gte = filters.from;
            if (filters.to)
                where.timestamp.lte = filters.to;
        }
        if (filters.resolved !== undefined) {
            where.resolved = filters.resolved;
        }
        if (filters.endpoint) {
            where.endpoint = filters.endpoint;
        }
        return this.prisma.error_logs.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: filters.limit || 100,
        });
    }
    async getErrorsByEndpoint(from, to) {
        const errors = await this.prisma.error_logs.findMany({
            where: {
                timestamp: { gte: from, lte: to },
            },
            select: {
                endpoint: true,
                status_code: true,
            },
        });
        const grouped = errors.reduce((acc, err) => {
            const endpoint = err.endpoint || "unknown";
            if (!acc[endpoint]) {
                acc[endpoint] = { endpoint, count: 0, codes: {} };
            }
            acc[endpoint].count++;
            const code = err.status_code || 500;
            acc[endpoint].codes[code] = (acc[endpoint].codes[code] || 0) + 1;
            return acc;
        }, {});
        return Object.values(grouped);
    }
    async markResolved(id) {
        return this.prisma.error_logs.update({
            where: { id },
            data: { resolved: true },
        });
    }
    async getErrorDetails(id) {
        return this.prisma.error_logs.findUnique({
            where: { id },
        });
    }
    async cleanupOldErrors() {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await this.prisma.error_logs.deleteMany({
            where: {
                resolved: true,
                timestamp: { lt: cutoff },
            },
        });
        return result.count;
    }
};
exports.ErrorTrackingService = ErrorTrackingService;
exports.ErrorTrackingService = ErrorTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ErrorTrackingService);
//# sourceMappingURL=error-tracking.service.js.map