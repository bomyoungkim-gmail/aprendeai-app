import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AdminService } from "./admin.service";
import { SecretService } from "./services/secret.service";
import { Roles } from "./decorators/roles.decorator";
import { RolesGuard } from "./guards/roles.guard";
import { SystemRole, ContextRole } from "@prisma/client";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import {
  UserSearchDto,
  UpdateUserStatusDto,
  UpdateUserRolesDto,
  ImpersonateUserDto,
} from "./dto/user-management.dto";
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  ToggleFeatureFlagDto,
  DeleteFeatureFlagDto,
  FeatureFlagFilterDto,
} from "./dto/feature-flag.dto";

@ApiTags("admin")
@Controller("admin")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private secretService: SecretService,
  ) {}

  // ========================================
  // Auth & Profile
  // ========================================

  @Get("me")
  @Roles(
    SystemRole.ADMIN,
    SystemRole.SUPPORT,
    SystemRole.OPS,
    ContextRole.INSTITUTION_EDUCATION_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current admin user info with roles and permissions",
  })
  @ApiResponse({
    status: 200,
    description: "Returns user info with role assignments",
  })
  async getAdminMe(@Request() req) {
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

      permissions: this.getPermissionsForRole(
        user.system_role || user.last_context_role,
      ),
    };
  }

  // ========================================
  // Platform Dashboard
  // ========================================

  @Get("stats")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get platform-wide statistics for admin dashboard" })
  @ApiResponse({ status: 200, description: "Returns platform statistics" })
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get("institutions")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all institutions with pagination" })
  async listInstitutions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.listInstitutions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  // ========================================
  // User Management
  // ========================================

  @Get("users")
  @Roles(SystemRole.ADMIN, SystemRole.SUPPORT, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Search and list users with pagination" })
  async searchUsers(@Query() searchDto: UserSearchDto) {
    const { page = 1, limit = 25, ...filters } = searchDto;
    return this.adminService.searchUsers({ ...filters, page, limit });
  }

  @Get("users/:id")
  @Roles(SystemRole.ADMIN, SystemRole.SUPPORT, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get detailed user information" })
  async getUserDetail(@Param("id") id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put("users/:id/status")
  @Roles(SystemRole.ADMIN, SystemRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user status" })
  async updateUserStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req,
  ) {
    return this.adminService.updateUserStatus(
      id,
      dto.status,
      dto.reason,
      req.user.userId,
      req.user.systemRole, // TODO: Update Service to accept SystemRole/string
    );
  }

  @Put("users/:id/roles")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user role assignments (ADMIN only)" })
  async updateUserRoles(
    @Param("id") id: string,
    @Body() dto: UpdateUserRolesDto,
    @Request() req,
  ) {
    return this.adminService.updateUserRoles(
      id,
      dto.roles,
      dto.reason,
      req.user.userId,
      req.user.systemRole,
    );
  }

  @Post("users/:id/impersonate")
  @Roles(SystemRole.ADMIN, SystemRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate impersonation token for user" })
  async impersonateUser(
    @Param("id") id: string,
    @Body() dto: ImpersonateUserDto,
    @Request() req,
  ) {
    return this.adminService.createImpersonationToken(
      id,
      req.user.userId,
      req.user.systemRole,
      dto.reason,
      dto.durationMinutes || 15,
    );
  }

  // ========================================
  // Feature Flags
  // ========================================

  @Get("feature-flags")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all feature flags" })
  @ApiResponse({ status: 200, description: "Returns list of feature flags" })
  async listFeatureFlags(@Query() filter: FeatureFlagFilterDto) {
    const convertedFilter: any = {};
    if (filter.environment) {
      convertedFilter.environment = filter.environment as any;
    }
    if (filter.enabled !== undefined) {
      convertedFilter.enabled = filter.enabled;
    }
    return this.adminService.listFeatureFlags(convertedFilter);
  }

  @Get("feature-flags/:id")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get feature flag details" })
  async getFeatureFlag(@Param("id") id: string) {
    return this.adminService.getFeatureFlag(id);
  }

  @Post("feature-flags")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new feature flag (ADMIN only)" })
  async createFeatureFlag(@Body() dto: CreateFeatureFlagDto, @Request() req) {
    return this.adminService.createFeatureFlag(
      dto,
      req.user.userId,
      req.user.systemRole,
    );
  }

  @Put("feature-flags/:id")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update feature flag (OPS can only toggle enabled)",
  })
  async updateFeatureFlag(
    @Param("id") id: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Request() req,
  ) {
    // OPS can only toggle enabled field
    if (
      req.user.systemRole === SystemRole.OPS &&
      Object.keys(dto).some((k) => k !== "enabled")
    ) {
      throw new Error("OPS role can only toggle enabled field");
    }

    return this.adminService.updateFeatureFlag(
      id,
      dto,
      req.user.userId,
      req.user.systemRole,
    );
  }

  @Post("feature-flags/:id/toggle")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Quick toggle feature flag on/off" })
  async toggleFeatureFlag(
    @Param("id") id: string,
    @Body() dto: ToggleFeatureFlagDto,
    @Request() req,
  ) {
    return this.adminService.toggleFeatureFlag(
      id,
      dto.enabled,
      dto.reason,
      req.user.userId,
      req.user.systemRole,
    );
  }

  @Delete("feature-flags/:id")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete feature flag (ADMIN only)" })
  async deleteFeatureFlag(
    @Param("id") id: string,
    @Body() dto: DeleteFeatureFlagDto,
    @Request() req,
  ) {
    return this.adminService.deleteFeatureFlag(
      id,
      dto.reason,
      req.user.userId,
      req.user.systemRole,
    );
  }

  // ========================================
  // Secrets Management (Encrypted)
  // ========================================

  @Get("secrets")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List secrets (metadata only, ADMIN only)" })
  async listSecrets(@Query() filter: any) {
    return this.secretService.listSecrets(filter);
  }

  @Get("secrets/:id")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get secret with decrypted value (ADMIN only)" })
  async getSecret(@Param("id") id: string, @Request() req) {
    // Audit log for viewing secret
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

  @Post("secrets")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create encrypted secret (ADMIN only)" })
  async createSecret(@Body() dto: any, @Request() req) {
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

  @Put("secrets/:id")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Rotate/update secret (ADMIN only)" })
  async updateSecret(
    @Param("id") id: string,
    @Body() dto: any,
    @Request() req,
  ) {
    return this.secretService.updateSecret(
      id,
      dto.value,
      dto.reason,
      req.user.userId,
      req.user.systemRole,
      (data) => this.adminService.createAuditLog(data),
    );
  }

  @Delete("secrets/:id")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete secret (ADMIN only)" })
  async deleteSecret(
    @Param("id") id: string,
    @Body() dto: any,
    @Request() req,
  ) {
    return this.secretService.deleteSecret(
      id,
      dto.reason,
      req.user.userId,
      req.user.systemRole,
      (data) => this.adminService.createAuditLog(data),
    );
  }

  // ========================================
  // Audit Logs
  // ========================================

  @Get("audit-logs")
  @Roles(SystemRole.ADMIN, SystemRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get audit logs with filters" })
  async getAuditLogs(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.actorUserId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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

  // ========================================
  // AI Service Metrics
  // ========================================

  @Get("ai/metrics")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get AI service optimization metrics" })
  @ApiResponse({
    status: 200,
    description:
      "Returns AI metrics including cache hit rate, token reduction, memory jobs, and response times",
  })
  async getAIMetrics() {
    // Fetch from AI service - Phase 1: Centralized URLs
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
    } catch (error) {
      // Graceful degradation
      return {
        success: false,
        error: "AI service metrics unavailable",
        message: error.message,
        data: null,
      };
    }
  }

  // ========================================
  // Decision Engine Metrics (Item 10.1)
  // ========================================

  @Get("metrics/decisions")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get Decision Engine metrics (80/20 rule verification)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns decision counts by channel and deterministic ratio",
  })
  async getDecisionMetrics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    // Default to last 24 hours if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const metrics = await this.adminService.getDecisionMetrics(start, end);

    return {
      success: true,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics,
      evaluation: {
        target: 0.8,
        achieved: metrics.deterministicRatio >= 0.8,
        message:
          metrics.deterministicRatio >= 0.8
            ? "✅ Target achieved: 80%+ decisions are deterministic"
            : `⚠️ Below target: Only ${(metrics.deterministicRatio * 100).toFixed(1)}% deterministic`,
      },
    };
  }

  // ========================================
  // Helpers
  // ========================================

  private getPermissionsForRole(role: string): string[] {
    const permissions: Record<string, string[]> = {
      [SystemRole.ADMIN]: [
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
      [SystemRole.SUPPORT]: [
        "view_dashboard",
        "view_users",
        "view_audit_logs",
        "impersonate_users",
        "reprocess_jobs",
      ],
      [SystemRole.OPS]: [
        "view_dashboard",
        "manage_flags",
        "manage_limits",
        "manage_queues",
      ],
      [ContextRole.INSTITUTION_EDUCATION_ADMIN]: [
        "view_own_institution",
        "manage_own_classes",
      ],
    };

    return permissions[role] || [];
  }
}
