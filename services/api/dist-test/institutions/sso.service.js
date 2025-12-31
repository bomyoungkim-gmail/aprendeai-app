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
exports.SSOService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const admin_service_1 = require("../admin/admin.service");
const crypto_1 = require("crypto");
let SSOService = class SSOService {
    constructor(prisma, adminService) {
        this.prisma = prisma;
        this.adminService = adminService;
    }
    async createConfig(dto, createdBy) {
        const institution = await this.prisma.institutions.findUnique({
            where: { id: dto.institutionId },
        });
        if (!institution) {
            throw new common_1.NotFoundException("Institution not found");
        }
        const existing = await this.prisma.sso_configurations.findFirst({
            where: { institution_id: dto.institutionId },
        });
        if (existing) {
            throw new common_1.BadRequestException("SSO already configured for this institution");
        }
        this.validateProviderConfig(dto.provider, dto);
        const config = await this.prisma.sso_configurations.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                institution_id: dto.institutionId,
                provider: dto.provider,
                enabled: false,
                entity_id: dto.entityId,
                sso_url: dto.ssoUrl,
                certificate: dto.certificate,
                client_id: dto.clientId,
                client_secret: dto.clientSecret,
                role_mapping: dto.roleMapping || {},
                updated_at: new Date(),
            },
        });
        await this.prisma.institutions.update({
            where: { id: dto.institutionId },
            data: { sso_enabled: true, updated_at: new Date() },
        });
        await this.adminService.createAuditLog({
            actorUserId: createdBy,
            action: "CREATE_SSO_CONFIG",
            resourceType: "SSOConfiguration",
            resourceId: config.id,
            afterJson: config,
        });
        return config;
    }
    async getConfig(institutionId) {
        const config = await this.prisma.sso_configurations.findFirst({
            where: { institution_id: institutionId },
            include: {
                institutions: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!config) {
            throw new common_1.NotFoundException("SSO not configured for this institution");
        }
        return Object.assign(Object.assign({}, config), { clientSecret: config.client_secret ? "••••••••" : null, certificate: config.certificate ? "••••••••" : null });
    }
    async updateConfig(institutionId, dto, updatedBy) {
        const config = await this.prisma.sso_configurations.findFirst({
            where: { institution_id: institutionId },
        });
        if (!config) {
            throw new common_1.NotFoundException("SSO not configured");
        }
        const before = Object.assign({}, config);
        const updated = await this.prisma.sso_configurations.update({
            where: { id: config.id },
            data: {
                enabled: dto.enabled !== undefined ? dto.enabled : config.enabled,
                entity_id: dto.entityId || config.entity_id,
                sso_url: dto.ssoUrl || config.sso_url,
                certificate: dto.certificate || config.certificate,
                client_id: dto.clientId || config.client_id,
                client_secret: dto.clientSecret || config.client_secret,
                role_mapping: dto.roleMapping || config.role_mapping,
                updated_at: new Date(),
            },
        });
        await this.adminService.createAuditLog({
            actorUserId: updatedBy,
            action: "UPDATE_SSO_CONFIG",
            resourceType: "SSOConfiguration",
            resourceId: config.id,
            beforeJson: before,
            afterJson: updated,
        });
        return updated;
    }
    async deleteConfig(institutionId, deletedBy) {
        const config = await this.prisma.sso_configurations.findFirst({
            where: { institution_id: institutionId },
        });
        if (!config) {
            throw new common_1.NotFoundException("SSO not configured");
        }
        await this.prisma.sso_configurations.delete({
            where: { id: config.id },
        });
        await this.prisma.institutions.update({
            where: { id: institutionId },
            data: { sso_enabled: false, updated_at: new Date() },
        });
        await this.adminService.createAuditLog({
            actorUserId: deletedBy,
            action: "DELETE_SSO_CONFIG",
            resourceType: "SSOConfiguration",
            resourceId: config.id,
            beforeJson: config,
        });
        return { message: "SSO configuration deleted successfully" };
    }
    async testConfig(institutionId) {
        const config = await this.prisma.sso_configurations.findFirst({
            where: { institution_id: institutionId },
        });
        if (!config) {
            throw new common_1.NotFoundException("SSO not configured");
        }
        const isValid = this.validateProviderConfig(config.provider, config);
        return {
            valid: isValid,
            message: isValid
                ? "Configuration appears valid (full test not implemented)"
                : "Missing required fields",
            provider: config.provider,
        };
    }
    validateProviderConfig(provider, config) {
        switch (provider) {
            case "SAML":
                return !!(config.entityId && config.ssoUrl && config.certificate);
            case "GOOGLE_WORKSPACE":
            case "MICROSOFT_ENTRA":
            case "OKTA":
            case "CUSTOM_OIDC":
                return !!(config.clientId && config.clientSecret);
            default:
                throw new common_1.BadRequestException("Unsupported SSO provider");
        }
    }
};
exports.SSOService = SSOService;
exports.SSOService = SSOService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        admin_service_1.AdminService])
], SSOService);
//# sourceMappingURL=sso.service.js.map