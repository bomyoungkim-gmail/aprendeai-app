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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const admin_service_1 = require("./admin.service");
const secret_service_1 = require("./services/secret.service");
const roles_decorator_1 = require("./decorators/roles.decorator");
const roles_guard_1 = require("./guards/roles.guard");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const user_management_dto_1 = require("./dto/user-management.dto");
const feature_flag_dto_1 = require("./dto/feature-flag.dto");
let AdminController = class AdminController {
    constructor(adminService, secretService) {
        this.adminService = adminService;
        this.secretService = secretService;
    }
    async getAdminMe(req) {
        const user = await this.adminService.getUserWithRoles(req.user.userId);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                system_role: user.system_role,
                context_role: user.last_context_role,
                status: user.status,
                lastLoginAt: user.last_login_at,
            },
            institution_members: user.institution_members,
            family_members: user.family_members,
            permissions: this.getPermissionsForRole(user.system_role || user.last_context_role),
        };
    }
    async getPlatformStats() {
        return this.adminService.getPlatformStats();
    }
    async listInstitutions(page, limit, search) {
        return this.adminService.listInstitutions(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, search);
    }
    async searchUsers(searchDto) {
        const { page = 1, limit = 25 } = searchDto, filters = __rest(searchDto, ["page", "limit"]);
        return this.adminService.searchUsers(Object.assign(Object.assign({}, filters), { page, limit }));
    }
    async getUserDetail(id) {
        return this.adminService.getUserDetail(id);
    }
    async updateUserStatus(id, dto, req) {
        return this.adminService.updateUserStatus(id, dto.status, dto.reason, req.user.userId, req.user.systemRole);
    }
    async updateUserRoles(id, dto, req) {
        return this.adminService.updateUserRoles(id, dto.roles, dto.reason, req.user.userId, req.user.systemRole);
    }
    async impersonateUser(id, dto, req) {
        return this.adminService.createImpersonationToken(id, req.user.userId, req.user.systemRole, dto.reason, dto.durationMinutes || 15);
    }
    async listFeatureFlags(filter) {
        const convertedFilter = {};
        if (filter.environment) {
            convertedFilter.environment = filter.environment;
        }
        if (filter.enabled !== undefined) {
            convertedFilter.enabled = filter.enabled;
        }
        return this.adminService.listFeatureFlags(convertedFilter);
    }
    async getFeatureFlag(id) {
        return this.adminService.getFeatureFlag(id);
    }
    async createFeatureFlag(dto, req) {
        return this.adminService.createFeatureFlag(dto, req.user.userId, req.user.systemRole);
    }
    async updateFeatureFlag(id, dto, req) {
        if (req.user.systemRole === client_1.SystemRole.OPS &&
            Object.keys(dto).some((k) => k !== "enabled")) {
            throw new Error("OPS role can only toggle enabled field");
        }
        return this.adminService.updateFeatureFlag(id, dto, req.user.userId, req.user.systemRole);
    }
    async toggleFeatureFlag(id, dto, req) {
        return this.adminService.toggleFeatureFlag(id, dto.enabled, dto.reason, req.user.userId, req.user.systemRole);
    }
    async deleteFeatureFlag(id, dto, req) {
        return this.adminService.deleteFeatureFlag(id, dto.reason, req.user.userId, req.user.systemRole);
    }
    async listSecrets(filter) {
        return this.secretService.listSecrets(filter);
    }
    async getSecret(id, req) {
        const secret = await this.secretService.getSecret(id);
        await this.adminService.createAuditLog({
            actorUserId: req.user.userId,
            actorRole: req.user.systemRole,
            action: "SECRET_VIEWED",
            resourceType: "SECRET",
            resourceId: id,
            afterJson: { key: secret.key },
        });
        return secret;
    }
    async createSecret(dto, req) {
        const result = await this.secretService.createSecret(dto, req.user.userId);
        await this.adminService.createAuditLog({
            actorUserId: req.user.userId,
            actorRole: req.user.systemRole,
            action: "SECRET_CREATED",
            resourceType: "SECRET",
            resourceId: result.id,
            afterJson: { key: dto.key, provider: dto.provider },
        });
        return result;
    }
    async updateSecret(id, dto, req) {
        return this.secretService.updateSecret(id, dto.value, dto.reason, req.user.userId, req.user.systemRole, (data) => this.adminService.createAuditLog(data));
    }
    async deleteSecret(id, dto, req) {
        return this.secretService.deleteSecret(id, dto.reason, req.user.userId, req.user.systemRole, (data) => this.adminService.createAuditLog(data));
    }
    async getAuditLogs(page, limit, action, userId, startDate, endDate) {
        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (action)
            where.action = action;
        if (userId)
            where.actorUserId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const logs = await this.adminService.getAuditLogs({
            skip,
            take: limitNum,
            where,
            orderBy: { createdAt: "desc" },
        });
        return {
            data: logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
            },
        };
    }
    async getAIMetrics() {
        const { URL_CONFIG } = require("../config/urls.config");
        const aiServiceUrl = URL_CONFIG.ai.base;
        try {
            const axios = require("axios");
            const response = await axios.get(`${aiServiceUrl}/metrics`, {
                timeout: 5000,
            });
            return {
                success: true,
                data: response.data,
                fetched_at: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                success: false,
                error: "AI service metrics unavailable",
                message: error.message,
                data: null,
            };
        }
    }
    getPermissionsForRole(role) {
        const permissions = {
            [client_1.SystemRole.ADMIN]: [
                "view_dashboard",
                "manage_users",
                "manage_integrations",
                "manage_secrets",
                "view_audit_logs",
                "manage_flags",
                "manage_limits",
                "manage_queues",
                "impersonate_users",
            ],
            [client_1.SystemRole.SUPPORT]: [
                "view_dashboard",
                "view_users",
                "view_audit_logs",
                "impersonate_users",
                "reprocess_jobs",
            ],
            [client_1.SystemRole.OPS]: [
                "view_dashboard",
                "manage_flags",
                "manage_limits",
                "manage_queues",
            ],
            [client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN]: [
                "view_own_institution",
                "manage_own_classes",
            ],
        };
        return permissions[role] || [];
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)("me"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT, client_1.SystemRole.OPS, client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Get current admin user info with roles and permissions",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Returns user info with role assignments",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminMe", null);
__decorate([
    (0, common_1.Get)("stats"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get platform-wide statistics for admin dashboard" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns platform statistics" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlatformStats", null);
__decorate([
    (0, common_1.Get)("institutions"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List all institutions with pagination" }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listInstitutions", null);
__decorate([
    (0, common_1.Get)("users"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Search and list users with pagination" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_management_dto_1.UserSearchDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)("users/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get detailed user information" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Put)("users/:id/status"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Update user status" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_management_dto_1.UpdateUserStatusDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Put)("users/:id/roles"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Update user role assignments (ADMIN only)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_management_dto_1.UpdateUserRolesDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRoles", null);
__decorate([
    (0, common_1.Post)("users/:id/impersonate"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Generate impersonation token for user" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_management_dto_1.ImpersonateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "impersonateUser", null);
__decorate([
    (0, common_1.Get)("feature-flags"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List all feature flags" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns list of feature flags" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [feature_flag_dto_1.FeatureFlagFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listFeatureFlags", null);
__decorate([
    (0, common_1.Get)("feature-flags/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get feature flag details" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFeatureFlag", null);
__decorate([
    (0, common_1.Post)("feature-flags"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create new feature flag (ADMIN only)" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [feature_flag_dto_1.CreateFeatureFlagDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createFeatureFlag", null);
__decorate([
    (0, common_1.Put)("feature-flags/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Update feature flag (OPS can only toggle enabled)",
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, feature_flag_dto_1.UpdateFeatureFlagDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateFeatureFlag", null);
__decorate([
    (0, common_1.Post)("feature-flags/:id/toggle"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Quick toggle feature flag on/off" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, feature_flag_dto_1.ToggleFeatureFlagDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleFeatureFlag", null);
__decorate([
    (0, common_1.Delete)("feature-flags/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Delete feature flag (ADMIN only)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, feature_flag_dto_1.DeleteFeatureFlagDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteFeatureFlag", null);
__decorate([
    (0, common_1.Get)("secrets"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List secrets (metadata only, ADMIN only)" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listSecrets", null);
__decorate([
    (0, common_1.Get)("secrets/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get secret with decrypted value (ADMIN only)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSecret", null);
__decorate([
    (0, common_1.Post)("secrets"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create encrypted secret (ADMIN only)" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSecret", null);
__decorate([
    (0, common_1.Put)("secrets/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Rotate/update secret (ADMIN only)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSecret", null);
__decorate([
    (0, common_1.Delete)("secrets/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Delete secret (ADMIN only)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSecret", null);
__decorate([
    (0, common_1.Get)("audit-logs"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.SUPPORT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get audit logs with filters" }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("action")),
    __param(3, (0, common_1.Query)("userId")),
    __param(4, (0, common_1.Query)("startDate")),
    __param(5, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)("ai/metrics"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get AI service optimization metrics" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Returns AI metrics including cache hit rate, token reduction, memory jobs, and response times",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAIMetrics", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)("admin"),
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        secret_service_1.SecretService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map