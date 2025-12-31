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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const manage_feature_flags_use_case_1 = require("./application/use-cases/manage-feature-flags.use-case");
const get_platform_stats_use_case_1 = require("./application/use-cases/get-platform-stats.use-case");
const admin_user_management_use_case_1 = require("./application/use-cases/admin-user-management.use-case");
const admin_repository_interface_1 = require("./domain/admin.repository.interface");
const audit_log_entity_1 = require("./domain/audit-log.entity");
let AdminService = class AdminService {
    constructor(prisma, manageFlagsUseCase, getStatsUseCase, userManagementUseCase, flagsRepo, auditRepo) {
        this.prisma = prisma;
        this.manageFlagsUseCase = manageFlagsUseCase;
        this.getStatsUseCase = getStatsUseCase;
        this.userManagementUseCase = userManagementUseCase;
        this.flagsRepo = flagsRepo;
        this.auditRepo = auditRepo;
    }
    async listFeatureFlags(filter) {
        return this.manageFlagsUseCase.list(filter);
    }
    async getFeatureFlag(id) {
        const flag = await this.manageFlagsUseCase.get(id);
        if (!flag)
            throw new common_1.NotFoundException("Feature flag not found");
        return flag;
    }
    async createFeatureFlag(data, createdBy, actorRole) {
        return this.manageFlagsUseCase.create(data, { userId: createdBy, role: actorRole });
    }
    async updateFeatureFlag(id, data, actorUserId, actorRole) {
        return this.manageFlagsUseCase.update(id, data, { userId: actorUserId, role: actorRole });
    }
    async toggleFeatureFlag(id, enabled, reason, actorUserId, actorRole) {
        return this.manageFlagsUseCase.toggle(id, enabled, reason, { userId: actorUserId, role: actorRole });
    }
    async deleteFeatureFlag(id, reason, actorUserId, actorRole) {
        await this.manageFlagsUseCase.delete(id, reason, { userId: actorUserId, role: actorRole });
        return { deleted: true };
    }
    async evaluateFeatureFlag(key, userId, institutionId) {
        var _a;
        const currentEnv = (((_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || "DEV");
        const flag = await this.flagsRepo.evaluate(key, currentEnv, userId, institutionId);
        if (flag) {
            return { enabled: flag.enabled, reason: "Flag found" };
        }
        return { enabled: false, reason: "Flag not found" };
    }
    async getPlatformStats() {
        return this.getStatsUseCase.execute();
    }
    async searchUsers(params) {
        return this.userManagementUseCase.searchUsers(params);
    }
    async updateUserStatus(userId, status, reason, actorUserId, actorRole) {
        return this.userManagementUseCase.updateUserStatus(userId, status, reason, { userId: actorUserId, role: actorRole });
    }
    async createImpersonationToken(targetUserId, actorUserId, actorRole, reason, durationMinutes) {
        return this.userManagementUseCase.createImpersonationToken(targetUserId, { userId: actorUserId, role: actorRole }, reason, durationMinutes);
    }
    async listInstitutions(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
            ],
        } : {};
        const [institutions, total] = await Promise.all([
            this.prisma.institutions.findMany({
                where, skip, take: limit,
                include: { _count: { select: { institution_members: true, domains: true } } },
                orderBy: { created_at: "desc" },
            }),
            this.prisma.institutions.count({ where }),
        ]);
        return {
            data: institutions,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getUserWithRoles(userId) {
        return this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, system_role: true, last_context_role: true, status: true, last_login_at: true,
                institution_members: { select: { role: true, status: true, institutions: { select: { name: true } } } },
                family_members: { select: { role: true, status: true, families: { select: { name: true } } } },
            },
        });
    }
    async getUserDetail(userId) {
        return this.prisma.users.findUnique({
            where: { id: userId },
            include: {
                institutions: true,
                institution_members: true,
                family_members: true,
                _count: { select: { contents_created_by: true, reading_sessions: true, assessment_attempts: true } },
            },
        });
    }
    async updateUserRoles(userId, roles, reason, actorUserId, actorRole) {
        return { count: 0 };
    }
    async createAuditLog(data) {
        return this.auditRepo.create(new audit_log_entity_1.AuditLog(data));
    }
    async getAuditLogs(params) {
        return this.auditRepo.findMany(params);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(admin_repository_interface_1.IFeatureFlagsRepository)),
    __param(5, (0, common_1.Inject)(admin_repository_interface_1.IAuditLogsRepository)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        manage_feature_flags_use_case_1.ManageFeatureFlagsUseCase,
        get_platform_stats_use_case_1.GetPlatformStatsUseCase,
        admin_user_management_use_case_1.AdminUserManagementUseCase, Object, Object])
], AdminService);
//# sourceMappingURL=admin.service.js.map