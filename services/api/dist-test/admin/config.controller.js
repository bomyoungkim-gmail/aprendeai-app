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
exports.ConfigController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const client_1 = require("@prisma/client");
const config_service_1 = require("./services/config.service");
const admin_service_1 = require("./admin.service");
const config_dto_1 = require("./dto/config.dto");
let ConfigController = class ConfigController {
    constructor(configService, adminService) {
        this.configService = configService;
        this.adminService = adminService;
    }
    async getConfigs(filters) {
        return this.configService.getConfigs(filters);
    }
    async getConfig(id, resolveSecrets) {
        const resolve = resolveSecrets === "true";
        return this.configService.getConfig(id, resolve);
    }
    async createConfig(dto, req) {
        const config = await this.configService.createConfig(dto, req.user.userId);
        await this.adminService.createAuditLog({
            actorUserId: req.user.userId,
            actorRole: req.user.systemRole,
            action: "CONFIG_CREATED",
            resourceType: "CONFIG",
            resourceId: config.id,
            afterJson: {
                key: config.key,
                category: config.category,
                environment: config.environment,
            },
        });
        return config;
    }
    async updateConfig(id, dto, req) {
        const before = await this.configService.getConfig(id);
        const config = await this.configService.updateConfig(id, dto, req.user.userId);
        await this.adminService.createAuditLog({
            actorUserId: req.user.userId,
            actorRole: req.user.systemRole,
            action: "CONFIG_UPDATED",
            resourceType: "CONFIG",
            resourceId: config.id,
            beforeJson: { value: before.value },
            afterJson: { value: config.value },
        });
        return config;
    }
    async deleteConfig(id, req) {
        const config = await this.configService.getConfig(id);
        await this.configService.deleteConfig(id);
        await this.adminService.createAuditLog({
            actorUserId: req.user.userId,
            actorRole: req.user.systemRole,
            action: "CONFIG_DELETED",
            resourceType: "CONFIG",
            resourceId: id,
            beforeJson: {
                key: config.key,
                category: config.category,
            },
        });
        return { success: true, message: "Config deleted" };
    }
    async validateProvider(provider, dto) {
        return this.configService.validateProvider(provider, dto.config);
    }
    async getConfigsByCategory(category, environment) {
        return this.configService.getConfigsByCategory(category, environment);
    }
    async clearLLMCache(provider) {
        const cleared = await this.configService.clearLLMCache(provider);
        return {
            success: true,
            message: provider
                ? `Cache cleared for ${provider}`
                : "All LLM cache cleared",
            provider: provider || "all",
        };
    }
};
exports.ConfigController = ConfigController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all configs (SECRET_REF values masked)" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_dto_1.ConfigFilterDto]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getConfigs", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get config by ID (optionally resolve secrets)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("resolveSecrets")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create new config" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_dto_1.CreateConfigDto, Object]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "createConfig", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Update config" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, config_dto_1.UpdateConfigDto, Object]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Delete config" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "deleteConfig", null);
__decorate([
    (0, common_1.Post)("validate/:provider"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Validate provider configuration" }),
    __param(0, (0, common_1.Param)("provider")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, config_dto_1.ValidateProviderDto]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "validateProvider", null);
__decorate([
    (0, common_1.Get)("category/:category"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get configs by category" }),
    __param(0, (0, common_1.Param)("category")),
    __param(1, (0, common_1.Query)("environment")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "getConfigsByCategory", null);
__decorate([
    (0, common_1.Post)("llm/cache/clear"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Clear LLM config cache for immediate config refresh",
    }),
    __param(0, (0, common_1.Query)("provider")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "clearLLMCache", null);
exports.ConfigController = ConfigController = __decorate([
    (0, swagger_1.ApiTags)("admin-config"),
    (0, common_1.Controller)("admin/config"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        admin_service_1.AdminService])
], ConfigController);
//# sourceMappingURL=config.controller.js.map