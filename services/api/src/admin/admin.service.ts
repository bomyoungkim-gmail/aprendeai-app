import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
