import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Environment, ScopeType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ... existing methods (getUserWithRoles, searchUsers, etc.) ...

  // Feature Flags Methods
  async listFeatureFlags(filter?: { environment?: Environment; enabled?: boolean }) {
    const where: any = {};
    
    if (filter?.environment) {
      where.environment = filter.environment;
    }
    
    if (filter?.enabled !== undefined) {
      where.enabled = filter.enabled;
    }

    return this.prisma.featureFlag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeatureFlag(id: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found`);
    }

    return flag;
  }

  async getFeatureFlagByKey(key: string) {
    return this.prisma.featureFlag.findUnique({
      where: { key },
    });
  }

  async createFeatureFlag(
    data: {
      key: string;
      name: string;
      description?: string;
      enabled: boolean;
      environment?: string;
      scopeType?: string;
      scopeId?: string;
    },
    createdBy: string,
    actorRole: UserRole,
  ) {
    // Check if key already exists
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new BadRequestException(`Feature flag with key "${data.key}" already exists`);
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        ...data,
        environment: data.environment as Environment,
        scopeType: data.scopeType as ScopeType,
        createdBy,
      },
    });

    // Audit log
    await this.createAuditLog({
      actorUserId: createdBy,
      actorRole,
      action: 'FEATURE_FLAG_CREATED',
      resourceType: 'FEATURE_FLAG',
      resourceId: flag.id,
      afterJson: flag,
    });

    return flag;
  }

  async updateFeatureFlag(
    id: string,
    data: {
      name?: string;
      description?: string;
      enabled?: boolean;
      environment?: string;
      scopeType?: string;
      scopeId?: string;
    },
    actorUserId: string,
    actorRole: UserRole,
  ) {
    const existing = await this.getFeatureFlag(id);

    const updated = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        ...data,
        environment: data.environment as Environment,
        scopeType: data.scopeType as ScopeType,
      },
    });

    // Audit log
    await this.createAuditLog({
      actorUserId,
      actorRole,
      action: 'FEATURE_FLAG_UPDATED',
      resourceType: 'FEATURE_FLAG',
      resourceId: id,
      beforeJson: existing,
      afterJson: updated,
    });

    return updated;
  }

  async toggleFeatureFlag(
    id: string,
    enabled: boolean,
    reason: string | undefined,
    actorUserId: string,
    actorRole: UserRole,
  ) {
    const existing = await this.getFeatureFlag(id);

    const updated = await this.prisma.featureFlag.update({
      where: { id },
      data: { enabled },
    });

    // Audit log
    await this.createAuditLog({
      actorUserId,
      actorRole,
      action: 'FEATURE_FLAG_TOGGLED',
      resourceType: 'FEATURE_FLAG',
      resourceId: id,
      beforeJson: { enabled: existing.enabled },
      afterJson: { enabled },
      reason,
    });

    return updated;
  }

  async deleteFeatureFlag(
    id: string,
    reason: string,
    actorUserId: string,
    actorRole: UserRole,
  ) {
    const existing = await this.getFeatureFlag(id);

    await this.prisma.featureFlag.delete({
      where: { id },
    });

    // Audit log
    await this.createAuditLog({
      actorUserId,
      actorRole,
      action: 'FEATURE_FLAG_DELETED',
      resourceType: 'FEATURE_FLAG',
      resourceId: id,
      beforeJson: existing,
      reason,
    });

    return { deleted: true };
  }

  async evaluateFeatureFlag(
    key: string,
    userId?: string,
    institutionId?: string,
  ): Promise<{ enabled: boolean; reason?: string }> {
    // Priority: USER > INSTITUTION > GLOBAL
    
    // Try user-scoped first
    if (userId) {
      const userFlag = await this.prisma.featureFlag.findFirst({
        where: {
          key,
          scopeType: 'USER',
          scopeId: userId,
        },
      });
      
      if (userFlag) {
        return {
          enabled: userFlag.enabled,
          reason: `User-scoped: ${userFlag.name}`,
        };
      }
    }

    // Try institution-scoped
    if (institutionId) {
      const instFlag = await this.prisma.featureFlag.findFirst({
        where: {
          key,
          scopeType: 'INSTITUTION',
          scopeId: institutionId,
        },
      });
      
      if (instFlag) {
        return {
          enabled: instFlag.enabled,
          reason: `Institution-scoped: ${instFlag.name}`,
        };
      }
    }

    // Fall back to global (or environment-specific global)
    const currentEnv = (process.env.NODE_ENV?.toUpperCase() || 'DEV') as Environment;
    
    const globalFlag = await this.prisma.featureFlag.findFirst({
      where: {
        key,
        scopeType: { equals: null },
        OR: [
          { environment: null }, // All environments
          { environment: currentEnv }, // Current environment
        ],
      },
      orderBy: {
        environment: 'desc', // Prefer environment-specific over null
      },
    });

    if (globalFlag) {
      return {
        enabled: globalFlag.enabled,
        reason: `Global: ${globalFlag.name}`,
      };
    }

    // Flag not found - default to disabled
    return {
      enabled: false,
      reason: 'Flag not found - defaulting to disabled',
    };
  }

  /**
   * Get platform-wide statistics for admin dashboard
   */
  async getPlatformStats() {
    const [
      totalUsers,
      totalInstitutions,
      totalFamilies,
      totalContent,
      activeUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.institution.count(),
      this.prisma.family.count(),
      this.prisma.content.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalInstitutions,
      totalFamilies,
      totalContent,
      activeUsersThisWeek,
      newUsersThisMonth,
    };
  }

  /**
   * List all institutions with pagination (for admin dashboard)
   */
  async listInstitutions(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { state: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [institutions, total] = await Promise.all([
      this.prisma.institution.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              members: true,
              domains: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.institution.count({ where }),
    ]);

    return {
      data: institutions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ... existing methods continue below ...
  
  async getUserWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLoginAt: true,
        roleAssignments: {
          select: {
            role: true,
            scopeType: true,
            scopeId: true,
          },
        },
      },
    });
  }

  async searchUsers(params: {
    query?: string;
    status?: string;
    role?: UserRole;
    institutionId?: string;
    page: number;
    limit: number;
  }) {
    const { query, status, role, institutionId, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
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

  async getUserDetail(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: true,
        roleAssignments: true,
        _count: {
          select: {
            createdContents: true,
            readingSessions: true,
            assessmentAttempts: true,
          },
        },
      },
    });
  }

  async updateUserStatus(
    userId: string,
    status: string,
    reason: string,
    actorUserId: string,
    actorRole: UserRole,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await this.createAuditLog({
      actorUserId,
      actorRole,
      action: 'USER_STATUS_CHANGED',
      resourceType: 'USER',
      resourceId: userId,
      beforeJson: { status: user.status },
      afterJson: { status },
      reason,
    });

    return updated;
  }

  async updateUserRoles(
    userId: string,
    roles: Array<{ role: UserRole; scopeType?: string; scopeId?: string }>,
    reason: string,
    actorUserId: string,
    actorRole: UserRole,
  ) {
    const existingRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
    });

    await this.prisma.userRoleAssignment.deleteMany({
      where: { userId },
    });

    const newRoles = await this.prisma.userRoleAssignment.createMany({
      data: roles.map((r) => ({
        userId,
        role: r.role,
        scopeType: r.scopeType as any,
        scopeId: r.scopeId,
        createdBy: actorUserId,
      })),
    });

    await this.createAuditLog({
      actorUserId,
      actorRole,
      action: 'USER_ROLES_UPDATED',
      resourceType: 'USER',
      resourceId: userId,
      beforeJson: { roles: existingRoles },
      afterJson: { roles },
      reason,
    });

    return newRoles;
  }

  async createImpersonationToken(
    targetUserId: string,
    actorUserId: string,
    actorRole: UserRole,
    reason: string,
    durationMinutes: number,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const payload = {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      impersonatedBy: actorUserId,
      impersonatedByRole: actorRole,
      reason,
      expiresAt: expiresAt.toISOString(),
      type: 'impersonation',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: `${durationMinutes}m`,
    });

    await this.createAuditLog({
      actorUserId,
      actorRole,
      action: 'USER_IMPERSONATION_STARTED',
      resourceType: 'USER',
      resourceId: targetUserId,
      reason,
      afterJson: {
        targetUser: targetUser.email,
        durationMinutes,
        expiresAt,
      },
    });

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

  async createAuditLog(data: {
    actorUserId?: string;
    actorRole?: UserRole;
    action: string;
    resourceType: string;
    resourceId?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    beforeJson?: any;
    afterJson?: any;
    reason?: string;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async getAuditLogs(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;

    return this.prisma.auditLog.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
    });
  }
}
