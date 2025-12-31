import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AdminService } from "../admin/admin.service";
import { SSOProvider } from "@prisma/client";
import { randomUUID } from "crypto";

interface CreateSSOConfigDto {
  institutionId: string;
  provider: SSOProvider;
  entityId?: string;
  ssoUrl?: string;
  certificate?: string;
  clientId?: string;
  clientSecret?: string;
  roleMapping?: any;
}

interface UpdateSSOConfigDto {
  enabled?: boolean;
  entityId?: string;
  ssoUrl?: string;
  certificate?: string;
  clientId?: string;
  clientSecret?: string;
  roleMapping?: any;
}

@Injectable()
export class SSOService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  /**
   * Create SSO configuration for institution
   */
  async createConfig(dto: CreateSSOConfigDto, createdBy: string) {
    // Validate institution exists
    const institution = await this.prisma.institutions.findUnique({
      where: { id: dto.institutionId },
    });

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    // Check if SSO already configured
    const existing = await this.prisma.sso_configurations.findFirst({
      where: { institution_id: dto.institutionId },
    });

    if (existing) {
      throw new BadRequestException(
        "SSO already configured for this institution",
      );
    }

    // Validate provider-specific fields
    this.validateProviderConfig(dto.provider, dto);

    const config = await this.prisma.sso_configurations.create({
      data: {
        id: randomUUID(),
        institution_id: dto.institutionId,
        provider: dto.provider,
        enabled: false, // Disabled by default until tested
        entity_id: dto.entityId,
        sso_url: dto.ssoUrl,
        certificate: dto.certificate,
        client_id: dto.clientId,
        client_secret: dto.clientSecret,
        role_mapping: dto.roleMapping || {},
        updated_at: new Date(),
      },
    });

    // Update institution ssoEnabled flag
    await this.prisma.institutions.update({
      where: { id: dto.institutionId },
      data: { sso_enabled: true, updated_at: new Date() },
    });

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: createdBy,
      action: "CREATE_SSO_CONFIG",
      resourceType: "SSOConfiguration",
      resourceId: config.id,
      afterJson: config,
    });

    return config;
  }

  /**
   * Get SSO configuration for institution
   */
  async getConfig(institutionId: string) {
    const config = await this.prisma.sso_configurations.findFirst({
      where: { institution_id: institutionId },
      include: {
        institutions: {
          select: { id: true, name: true },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("SSO not configured for this institution");
    }

    // Mask sensitive data
    return {
      ...config,
      clientSecret: config.client_secret ? "••••••••" : null,
      certificate: config.certificate ? "••••••••" : null,
    };
  }

  /**
   * Update SSO configuration
   */
  async updateConfig(
    institutionId: string,
    dto: UpdateSSOConfigDto,
    updatedBy: string,
  ) {
    const config = await this.prisma.sso_configurations.findFirst({
      where: { institution_id: institutionId },
    });

    if (!config) {
      throw new NotFoundException("SSO not configured");
    }

    const before = { ...config };

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

    // Audit log
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

  /**
   * Delete SSO configuration
   */
  async deleteConfig(institutionId: string, deletedBy: string) {
    const config = await this.prisma.sso_configurations.findFirst({
      where: { institution_id: institutionId },
    });

    if (!config) {
      throw new NotFoundException("SSO not configured");
    }

    await this.prisma.sso_configurations.delete({
      where: { id: config.id },
    });

    // Update institution flag
    await this.prisma.institutions.update({
      where: { id: institutionId },
      data: { sso_enabled: false, updated_at: new Date() },
    });

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: deletedBy,
      action: "DELETE_SSO_CONFIG",
      resourceType: "SSOConfiguration",
      resourceId: config.id,
      beforeJson: config,
    });

    return { message: "SSO configuration deleted successfully" };
  }

  /**
   * Test SSO configuration (placeholder for future SAML validation)
   */
  async testConfig(institutionId: string) {
    const config = await this.prisma.sso_configurations.findFirst({
      where: { institution_id: institutionId },
    });

    if (!config) {
      throw new NotFoundException("SSO not configured");
    }

    // TODO: Implement actual SAML/OAuth validation
    // For now, just check if required fields are present

    const isValid = this.validateProviderConfig(config.provider, config);

    return {
      valid: isValid,
      message: isValid
        ? "Configuration appears valid (full test not implemented)"
        : "Missing required fields",
      provider: config.provider,
    };
  }

  /**
   * Validate provider-specific configuration
   */
  private validateProviderConfig(provider: SSOProvider, config: any): boolean {
    switch (provider) {
      case "SAML":
        return !!(config.entityId && config.ssoUrl && config.certificate);

      case "GOOGLE_WORKSPACE":
      case "MICROSOFT_ENTRA":
      case "OKTA":
      case "CUSTOM_OIDC":
        return !!(config.clientId && config.clientSecret);

      default:
        throw new BadRequestException("Unsupported SSO provider");
    }
  }
}
