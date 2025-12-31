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
exports.AdminUserManagementUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const admin_repository_interface_1 = require("../../domain/admin.repository.interface");
const audit_log_entity_1 = require("../../domain/audit-log.entity");
const uuid_1 = require("uuid");
const jwt_1 = require("@nestjs/jwt");
let AdminUserManagementUseCase = class AdminUserManagementUseCase {
    constructor(prisma, jwtService, auditRepo) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.auditRepo = auditRepo;
    }
    async searchUsers(params) {
        const { query, status, institutionId, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (query) {
            where.OR = [
                { email: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
            ];
        }
        if (status)
            where.status = status;
        if (institutionId)
            where.last_institution_id = institutionId;
        const [users, total] = await Promise.all([
            this.prisma.users.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    system_role: true,
                    last_context_role: true,
                    last_institution_id: true,
                    status: true,
                    last_login_at: true,
                    created_at: true,
                    institutions: { select: { id: true, name: true } },
                },
                orderBy: { created_at: "desc" },
            }),
            this.prisma.users.count({ where }),
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateUserStatus(userId, status, reason, actor) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("User not found");
        const updated = await this.prisma.users.update({
            where: { id: userId },
            data: { status },
        });
        await this.auditRepo.create(new audit_log_entity_1.AuditLog({
            id: (0, uuid_1.v4)(),
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: "USER_STATUS_CHANGED",
            resourceType: "USER",
            resourceId: userId,
            beforeJson: { status: user.status },
            afterJson: { status },
            reason,
        }));
        return updated;
    }
    async updateUserRoles(userId, roles, reason, actorUserId, actorRole) {
        console.warn(`Attempted to update roles for user ${userId}, but updateUserRoles is not yet implemented for the new multi-tenancy schema.`);
        return { count: 0 };
    }
    async createImpersonationToken(targetUserId, actor, reason, durationMinutes) {
        const targetUser = await this.prisma.users.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                email: true,
                name: true,
                last_context_role: true,
                system_role: true,
            },
        });
        if (!targetUser) {
            throw new Error("Target user not found");
        }
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        const payload = {
            userId: targetUser.id,
            email: targetUser.email,
            context_role: targetUser.system_role ? "ADMIN" : targetUser.last_context_role,
            system_role: targetUser.system_role,
            impersonatedBy: actor.userId,
            impersonatedByRole: actor.role,
            reason,
            expiresAt: expiresAt.toISOString(),
            type: "impersonation",
        };
        const token = this.jwtService.sign(payload, {
            expiresIn: `${durationMinutes}m`,
        });
        await this.auditRepo.create(new audit_log_entity_1.AuditLog({
            id: (0, uuid_1.v4)(),
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: "USER_IMPERSONATION_STARTED",
            resourceType: "USER",
            resourceId: targetUserId,
            reason,
            afterJson: {
                targetUser: targetUser.email,
                durationMinutes,
                expiresAt,
            },
        }));
        return {
            impersonationToken: token,
            expiresAt,
            targetUser: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
            },
        };
    }
};
exports.AdminUserManagementUseCase = AdminUserManagementUseCase;
exports.AdminUserManagementUseCase = AdminUserManagementUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(admin_repository_interface_1.IAuditLogsRepository)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService, Object])
], AdminUserManagementUseCase);
//# sourceMappingURL=admin-user-management.use-case.js.map