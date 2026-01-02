import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IAuditLogsRepository } from "../../domain/admin.repository.interface";
import { AuditLog } from "../../domain/audit-log.entity";
import { v4 as uuidv4 } from "uuid";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AdminUserManagementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(IAuditLogsRepository)
    private readonly auditRepo: IAuditLogsRepository,
  ) {}

  async searchUsers(params: {
    query?: string;
    status?: string;
    role?: string;
    institutionId?: string;
    page: number;
    limit: number;
  }) {
    const { query, status, institutionId, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.OR = [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (institutionId) where.last_institution_id = institutionId;

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          system_role: true,
          last_context_role: true,
          last_institution_id: true,
          status: true,
          last_login_at: true,
          created_at: true,
          institutions: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      this.prisma.users.count({ where }),
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

  async updateUserStatus(
    userId: string,
    status: string,
    reason: string,
    actor: { userId: string; role: string },
  ) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: { status },
    });

    await this.auditRepo.create(
      new AuditLog({
        id: uuidv4(),
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "USER_STATUS_CHANGED",
        resourceType: "USER",
        resourceId: userId,
        beforeJson: { status: user.status },
        afterJson: { status },
        reason,
      }),
    );

    return updated;
  }

  async updateUserRoles(
    userId: string,
    roles: Array<{ role: string; scopeType?: string; scopeId?: string }>,
    reason: string,
    actorUserId: string,
    actorRole: string,
  ) {
    console.warn(
      `Attempted to update roles for user ${userId}, but updateUserRoles is not yet implemented for the new multi-tenancy schema.`,
    );

    return { count: 0 };
  }

  async createImpersonationToken(
    targetUserId: string,
    actor: { userId: string; role: string },
    reason: string,
    durationMinutes: number,
  ) {
    const targetUser = await this.prisma.users.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        last_context_role: true,
        system_role: true,
      },
    });

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const payload = {
      userId: targetUser.id,
      email: targetUser.email,
      context_role: targetUser.system_role
        ? "ADMIN"
        : targetUser.last_context_role,
      system_role: targetUser.system_role,
      impersonatedBy: actor.userId,
      impersonatedByRole: actor.role,
      reason,
      expiresAt: expiresAt.toISOString(),
      type: "impersonation",
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: `${durationMinutes}m`,
    });

    await this.auditRepo.create(
      new AuditLog({
        id: uuidv4(),
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "USER_IMPERSONATION_STARTED",
        resourceType: "USER",
        resourceId: targetUserId,
        reason,
        afterJson: {
          targetUser: targetUser.email,
          durationMinutes,
          expiresAt,
        },
      }),
    );

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
}
