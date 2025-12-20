import { Controller, Get, Post, Put, Delete, UseGuards, Request, Param, Query, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { SecretService } from './services/secret.service';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  UserSearchDto,
  UpdateUserStatusDto,
  UpdateUserRolesDto,
  ImpersonateUserDto,
} from './dto/user-management.dto';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  ToggleFeatureFlagDto,
  DeleteFeatureFlagDto,
  FeatureFlagFilterDto,
} from './dto/feature-flag.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private secretService: SecretService,
  ) {}

  // ========================================
  // Auth & Profile
  // ========================================

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin user info with roles and permissions' })
  @ApiResponse({ status: 200, description: 'Returns user info with role assignments' })
  async getAdminMe(@Request() req) {
    const user = await this.adminService.getUserWithRoles(req.user.userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      roles: user.roleAssignments,
      permissions: this.getPermissionsForRole(user.role),
    };
  }

  // ========================================
  // User Management
  // ========================================

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search and list users with pagination' })
  async searchUsers(@Query() searchDto: UserSearchDto) {
    const { page = 1, limit = 25, ...filters } = searchDto;
    return this.adminService.searchUsers({ ...filters, page, limit });
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed user information' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user status' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req,
  ) {
    return this.adminService.updateUserStatus(
      id,
      dto.status,
      dto.reason,
      req.user.userId,
      req.user.role,
    );
  }

  @Put('users/:id/roles')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role assignments (ADMIN only)' })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
    @Request() req,
  ) {
    return this.adminService.updateUserRoles(
      id,
      dto.roles,
      dto.reason,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('users/:id/impersonate')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate impersonation token for user' })
  async impersonateUser(
    @Param('id') id: string,
    @Body() dto: ImpersonateUserDto,
    @Request() req,
  ) {
    return this.adminService.createImpersonationToken(
      id,
      req.user.userId,
      req.user.role,
      dto.reason,
      dto.durationMinutes || 15,
    );
  }

  // ========================================
  // Feature Flags
  // ========================================

  @Get('feature-flags')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiResponse({ status: 200, description: 'Returns list of feature flags' })
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

  @Get('feature-flags/:id')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feature flag details' })
  async getFeatureFlag(@Param('id') id: string) {
    return this.adminService.getFeatureFlag(id);
  }

  @Post('feature-flags')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new feature flag (ADMIN only)' })
  async createFeatureFlag(
    @Body() dto: CreateFeatureFlagDto,
    @Request() req,
  ) {
    return this.adminService.createFeatureFlag(
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Put('feature-flags/:id')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feature flag (OPS can only toggle enabled)' })
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Request() req,
  ) {
    // OPS can only toggle enabled field
    if (req.user.role === UserRole.OPS && Object.keys(dto).some(k => k !== 'enabled')) {
      throw new Error('OPS role can only toggle enabled field');
    }

    return this.adminService.updateFeatureFlag(
      id,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('feature-flags/:id/toggle')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quick toggle feature flag on/off' })
  async toggleFeatureFlag(
    @Param('id') id: string,
    @Body() dto: ToggleFeatureFlagDto,
    @Request() req,
  ) {
    return this.adminService.toggleFeatureFlag(
      id,
      dto.enabled,
      dto.reason,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete('feature-flags/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete feature flag (ADMIN only)' })
  async deleteFeatureFlag(
    @Param('id') id: string,
    @Body() dto: DeleteFeatureFlagDto,
    @Request() req,
  ) {
    return this.adminService.deleteFeatureFlag(
      id,
      dto.reason,
      req.user.userId,
      req.user.role,
    );
  }

  // ========================================
  // Secrets Management (Encrypted)
  // ========================================

  @Get('secrets')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List secrets (metadata only, ADMIN only)' })
  async listSecrets(@Query() filter: any) {
    return this.secretService.listSecrets(filter);
  }

  @Get('secrets/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get secret with decrypted value (ADMIN only)' })
  async getSecret(@Param('id') id: string, @Request() req) {
    // Audit log for viewing secret
    const secret = await this.secretService.getSecret(id);
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: 'SECRET_VIEWED',
      resourceType: 'SECRET',
      resourceId: id,
      afterJson: { key: secret.key },
    });
    return secret;
  }

  @Post('secrets')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create encrypted secret (ADMIN only)' })
  async createSecret(@Body() dto: any, @Request() req) {
    const result = await this.secretService.createSecret(dto, req.user.userId);
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: 'SECRET_CREATED',
      resourceType: 'SECRET',
      resourceId: result.id,
      afterJson: { key: dto.key, provider: dto.provider },
    });
    return result;
  }

  @Put('secrets/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate/update secret (ADMIN only)' })
  async updateSecret(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.secretService.updateSecret(
      id,
      dto.value,
      dto.reason,
      req.user.userId,
      req.user.role,
      (data) => this.adminService.createAuditLog(data),
    );
  }

  @Delete('secrets/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete secret (ADMIN only)' })
  async deleteSecret(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.secretService.deleteSecret(
      id,
      dto.reason,
      req.user.userId,
      req.user.role,
      (data) => this.adminService.createAuditLog(data),
    );
  }

  // ========================================
  // Helpers
  // ========================================

  private getPermissionsForRole(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: [
        'view_dashboard',
        'manage_users',
        'manage_integrations',
        'manage_secrets',
        'view_audit_logs',
        'manage_flags',
        'manage_limits',
        'manage_queues',
        'impersonate_users',
      ],
      [UserRole.SUPPORT]: [
        'view_dashboard',
        'view_users',
        'view_audit_logs',
        'impersonate_users',
        'reprocess_jobs',
      ],
      [UserRole.OPS]: [
        'view_dashboard',
        'manage_flags',
        'manage_limits',
        'manage_queues',
      ],
      [UserRole.INSTITUTION_ADMIN]: [
        'view_own_institution',
        'manage_own_classes',
      ],
      [UserRole.TEACHER]: [],
      [UserRole.STUDENT]: [],
      [UserRole.COMMON_USER]: [],
    };

    return permissions[role] || [];
  }
}
