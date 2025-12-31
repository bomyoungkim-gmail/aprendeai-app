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
exports.PrismaAuditLogsRepository = exports.PrismaFeatureFlagsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const feature_flag_entity_1 = require("../../domain/feature-flag.entity");
const audit_log_entity_1 = require("../../domain/audit-log.entity");
let PrismaFeatureFlagsRepository = class PrismaFeatureFlagsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(flag) {
        const created = await this.prisma.feature_flags.create({
            data: {
                id: flag.id,
                key: flag.key,
                name: flag.name,
                description: flag.description,
                enabled: flag.enabled,
                environment: flag.environment,
                scope_type: flag.scopeType,
                scope_id: flag.scopeId,
                created_by: flag.createdBy,
                updated_at: flag.updatedAt,
            },
        });
        return this.mapToDomain(created);
    }
    async update(id, updates) {
        const updated = await this.prisma.feature_flags.update({
            where: { id },
            data: {
                name: updates.name,
                description: updates.description,
                enabled: updates.enabled,
                environment: updates.environment,
                scope_type: updates.scopeType,
                scope_id: updates.scopeId,
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }
    async delete(id) {
        await this.prisma.feature_flags.delete({ where: { id } });
    }
    async findById(id) {
        const found = await this.prisma.feature_flags.findUnique({ where: { id } });
        return found ? this.mapToDomain(found) : null;
    }
    async findByKey(key) {
        const found = await this.prisma.feature_flags.findUnique({ where: { key } });
        return found ? this.mapToDomain(found) : null;
    }
    async findMany(filter) {
        const where = {};
        if (filter === null || filter === void 0 ? void 0 : filter.environment)
            where.environment = filter.environment;
        if ((filter === null || filter === void 0 ? void 0 : filter.enabled) !== undefined)
            where.enabled = filter.enabled;
        const found = await this.prisma.feature_flags.findMany({
            where,
            orderBy: { created_at: "desc" },
        });
        return found.map(this.mapToDomain);
    }
    async evaluate(key, environment, userId, institutionId) {
        if (userId) {
            const userFlag = await this.prisma.feature_flags.findFirst({
                where: { key, scope_type: "USER", scope_id: userId },
            });
            if (userFlag)
                return this.mapToDomain(userFlag);
        }
        if (institutionId) {
            const instFlag = await this.prisma.feature_flags.findFirst({
                where: { key, scope_type: "INSTITUTION", scope_id: institutionId },
            });
            if (instFlag)
                return this.mapToDomain(instFlag);
        }
        const globalFlag = await this.prisma.feature_flags.findFirst({
            where: {
                key,
                scope_type: { equals: null },
                OR: [
                    { environment: null },
                    { environment: environment }
                ]
            },
            orderBy: { environment: "desc" }
        });
        return globalFlag ? this.mapToDomain(globalFlag) : null;
    }
    mapToDomain(item) {
        return new feature_flag_entity_1.FeatureFlag({
            id: item.id,
            key: item.key,
            name: item.name,
            description: item.description,
            enabled: item.enabled,
            environment: item.environment,
            scopeType: item.scope_type,
            scopeId: item.scope_id,
            createdBy: item.created_by,
            updatedAt: item.updated_at,
            createdAt: item.created_at,
        });
    }
};
exports.PrismaFeatureFlagsRepository = PrismaFeatureFlagsRepository;
exports.PrismaFeatureFlagsRepository = PrismaFeatureFlagsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaFeatureFlagsRepository);
let PrismaAuditLogsRepository = class PrismaAuditLogsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(log) {
        const created = await this.prisma.audit_logs.create({
            data: {
                id: log.id,
                actor_user_id: log.actorUserId,
                actor_role: log.actorRole,
                action: log.action,
                resource_type: log.resourceType,
                resource_id: log.resourceId,
                request_id: log.requestId,
                ip: log.ip,
                user_agent: log.userAgent,
                before_json: log.beforeJson,
                after_json: log.afterJson,
                reason: log.reason,
            },
        });
        return this.mapToDomain(created);
    }
    async findMany(params) {
        const found = await this.prisma.audit_logs.findMany({
            skip: params.skip,
            take: params.take,
            where: params.where,
            orderBy: { created_at: "desc" }
        });
        return found.map(this.mapToDomain);
    }
    mapToDomain(item) {
        return new audit_log_entity_1.AuditLog({
            id: item.id,
            actorUserId: item.actor_user_id,
            actorRole: item.actor_role,
            action: item.action,
            resourceType: item.resource_type,
            resourceId: item.resource_id,
            requestId: item.request_id,
            ip: item.ip,
            userAgent: item.user_agent,
            beforeJson: item.before_json,
            afterJson: item.after_json,
            reason: item.reason,
            createdAt: item.created_at,
        });
    }
};
exports.PrismaAuditLogsRepository = PrismaAuditLogsRepository;
exports.PrismaAuditLogsRepository = PrismaAuditLogsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAuditLogsRepository);
//# sourceMappingURL=prisma-admin.repository.js.map