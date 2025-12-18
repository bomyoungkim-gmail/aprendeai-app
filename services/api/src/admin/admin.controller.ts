import { Controller, Get, Put, Post, UseGuards, Request, Param, Query, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
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

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin user info with roles and permissions' })
  @ApiResponse({ status: 200, description: 'Returns user info with role assignments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
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

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search and list users with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated user list' })
  async searchUsers(@Query() searchDto: UserSearchDto) {
    const { page = 1, limit = 25, ...filters } = searchDto;
    return this.adminService.searchUsers({ ...filters, page, limit });
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed user information' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user status (ACTIVE/SUSPENDED/DELETED)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
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
  @ApiResponse({ status: 200, description: 'User roles updated' })
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
  @ApiOperation({
    summary: 'Generate impersonation token for user',
    description: 'Creates a short-lived JWT token to impersonate the target user. All actions are audited.',
  })
  @ApiResponse({ status: 200, description: 'Returns impersonation token' })
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
