import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

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

  private getPermissionsForRole(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]:  [
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
