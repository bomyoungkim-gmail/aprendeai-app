import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Environment } from "@prisma/client";
import { ManageFeatureFlagsUseCase } from "./application/use-cases/manage-feature-flags.use-case";
import { GetPlatformStatsUseCase } from "./application/use-cases/get-platform-stats.use-case";
import { AdminUserManagementUseCase } from "./application/use-cases/admin-user-management.use-case";
import {
  IFeatureFlagsRepository,
  IAuditLogsRepository,
} from "./domain/admin.repository.interface";
import { AuditLog } from "./domain/audit-log.entity";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly manageFlagsUseCase: ManageFeatureFlagsUseCase,
    private readonly getStatsUseCase: GetPlatformStatsUseCase,
    private readonly userManagementUseCase: AdminUserManagementUseCase,
    @Inject(IFeatureFlagsRepository)
    private readonly flagsRepo: IFeatureFlagsRepository,
    @Inject(IAuditLogsRepository)
    private readonly auditRepo: IAuditLogsRepository,
  ) {}

  // Feature Flags
  async listFeatureFlags(filter?: {
    environment?: Environment;
    enabled?: boolean;
  }) {
    return this.manageFlagsUseCase.list(filter as any);
  }

  async getFeatureFlag(id: string) {
    const flag = await this.manageFlagsUseCase.get(id);
    if (!flag) throw new NotFoundException("Feature flag not found");
    return flag;
  }

  async createFeatureFlag(data: any, createdBy: string, actorRole: string) {
    return this.manageFlagsUseCase.create(data, {
      userId: createdBy,
      role: actorRole,
    });
  }

  async updateFeatureFlag(
    id: string,
    data: any,
    actorUserId: string,
    actorRole: string,
  ) {
    return this.manageFlagsUseCase.update(id, data, {
      userId: actorUserId,
      role: actorRole,
    });
  }

  async toggleFeatureFlag(
    id: string,
    enabled: boolean,
    reason: string | undefined,
    actorUserId: string,
    actorRole: string,
  ) {
    return this.manageFlagsUseCase.toggle(id, enabled, reason, {
      userId: actorUserId,
      role: actorRole,
    });
  }

  async deleteFeatureFlag(
    id: string,
    reason: string,
    actorUserId: string,
    actorRole: string,
  ) {
    await this.manageFlagsUseCase.delete(id, reason, {
      userId: actorUserId,
      role: actorRole,
    });
    return { deleted: true };
  }

  async evaluateFeatureFlag(
    key: string,
    userId?: string,
    institutionId?: string,
  ) {
    // Evaluation logic is in Repository, but we need environment.
    // Default to DEV just like before if not found?
    // UseCase could handle this but Repository has evaluate method.
    const currentEnv = (process.env.NODE_ENV?.toUpperCase() || "DEV") as any;
    const flag = await this.flagsRepo.evaluate(
      key,
      currentEnv,
      userId,
      institutionId,
    );

    if (flag) {
      return { enabled: flag.enabled, reason: "Flag found" }; // Simplified reason
    }
    return { enabled: false, reason: "Flag not found" };
  }

  // Platform Stats
  async getPlatformStats() {
    return this.getStatsUseCase.execute();
  }

  // User Management
  async searchUsers(params: any) {
    return this.userManagementUseCase.searchUsers(params);
  }

  async updateUserStatus(
    userId: string,
    status: string,
    reason: string,
    actorUserId: string,
    actorRole: string,
  ) {
    return this.userManagementUseCase.updateUserStatus(userId, status, reason, {
      userId: actorUserId,
      role: actorRole,
    });
  }

  async createImpersonationToken(
    targetUserId: string,
    actorUserId: string,
    actorRole: string,
    reason: string,
    durationMinutes: number,
  ) {
    return this.userManagementUseCase.createImpersonationToken(
      targetUserId,
      { userId: actorUserId, role: actorRole },
      reason,
      durationMinutes,
    );
  }

  // Passthroughs or specific logics remaining
  async listInstitutions(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
            { state: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [institutions, total] = await Promise.all([
      this.prisma.institutions.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { institution_members: true, domains: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      this.prisma.institutions.count({ where }),
    ]);

    return {
      data: institutions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserWithRoles(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        system_role: true,
        last_context_role: true,
        status: true,
        last_login_at: true,
        institution_members: {
          select: {
            role: true,
            status: true,
            institutions: { select: { name: true } },
          },
        },
        family_members: {
          select: {
            role: true,
            status: true,
            families: { select: { name: true } },
          },
        },
      },
    });
  }

  async getUserDetail(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        institutions: true,
        institution_members: true,
        family_members: true,
        _count: {
          select: {
            contents_created_by: true,
            reading_sessions: true,
            assessment_attempts: true,
          },
        },
      },
    });
  }

  async updateUserRoles(
    userId: string,
    roles: any,
    reason: string,
    actorUserId: string,
    actorRole: string,
  ) {
    // Stub kept
    return { count: 0 };
  }

  // Bridge for manual audit logs if needed
  async createAuditLog(data: any) {
    // This calls the repo directly now via injection if public, or use case?
    // AdminService had this public method.
    // We can map it to interface call.
    // Interface expects AuditLog entity.
    // Interface expects AuditLog entity.
    // data here is loose object.
    return this.auditRepo.create(new AuditLog(data));
  }

  async getAuditLogs(params: any) {
    return this.auditRepo.findMany(params);
  }
}
