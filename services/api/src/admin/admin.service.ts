import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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

    // Create audit log
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

    // Delete all existing role assignments
    await this.prisma.userRoleAssignment.deleteMany({
      where: { userId },
    });

    // Create new role assignments
    const newRoles = await this.prisma.userRoleAssignment.createMany({
      data: roles.map((r) => ({
        userId,
        role: r.role,
        scopeType: r.scopeType as any,
        scopeId: r.scopeId,
        createdBy: actorUserId,
      })),
    });

    // Audit log
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

    // Audit log
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
