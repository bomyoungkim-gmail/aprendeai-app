import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  IFeatureFlagsRepository,
  IAuditLogsRepository,
} from "../../domain/admin.repository.interface";
import {
  FeatureFlag,
  FeatureFlagEnvironment,
} from "../../domain/feature-flag.entity";
import { AuditLog } from "../../domain/audit-log.entity";
import { Environment, ScopeType } from "@prisma/client";

@Injectable()
export class PrismaFeatureFlagsRepository implements IFeatureFlagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(flag: FeatureFlag): Promise<FeatureFlag> {
    const created = await this.prisma.feature_flags.create({
      data: {
        id: flag.id,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        environment: flag.environment as Environment,
        scope_type: flag.scopeType as ScopeType,
        scope_id: flag.scopeId,
        created_by: flag.createdBy,
        updated_at: flag.updatedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async update(
    id: string,
    updates: Partial<FeatureFlag>,
  ): Promise<FeatureFlag> {
    const updated = await this.prisma.feature_flags.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        enabled: updates.enabled,
        environment: updates.environment as Environment,
        scope_type: updates.scopeType as ScopeType,
        scope_id: updates.scopeId,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.feature_flags.delete({ where: { id } });
  }

  async findById(id: string): Promise<FeatureFlag | null> {
    const found = await this.prisma.feature_flags.findUnique({ where: { id } });
    return found ? this.mapToDomain(found) : null;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const found = await this.prisma.feature_flags.findUnique({
      where: { key },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findMany(filter?: {
    environment?: FeatureFlagEnvironment;
    enabled?: boolean;
  }): Promise<FeatureFlag[]> {
    const where: any = {};
    if (filter?.environment)
      where.environment = filter.environment as Environment;
    if (filter?.enabled !== undefined) where.enabled = filter.enabled;

    const found = await this.prisma.feature_flags.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
    return found.map(this.mapToDomain);
  }

  async evaluate(
    key: string,
    environment: FeatureFlagEnvironment,
    userId?: string,
    institutionId?: string,
  ): Promise<FeatureFlag | null> {
    // Priority: USER > INSTITUTION > GLOBAL (with Environment check)
    if (userId) {
      const userFlag = await this.prisma.feature_flags.findFirst({
        where: { key, scope_type: "USER", scope_id: userId },
      });
      if (userFlag) return this.mapToDomain(userFlag);
    }

    if (institutionId) {
      const instFlag = await this.prisma.feature_flags.findFirst({
        where: { key, scope_type: "INSTITUTION", scope_id: institutionId },
      });
      if (instFlag) return this.mapToDomain(instFlag);
    }

    const globalFlag = await this.prisma.feature_flags.findFirst({
      where: {
        key,
        scope_type: { equals: null },
        OR: [
          { environment: null },
          { environment: environment as Environment },
        ],
      },
      orderBy: { environment: "desc" }, // Prefer specific env over null
    });

    return globalFlag ? this.mapToDomain(globalFlag) : null;
  }

  private mapToDomain(item: any): FeatureFlag {
    return new FeatureFlag({
      id: item.id,
      key: item.key,
      name: item.name,
      description: item.description,
      enabled: item.enabled,
      environment: item.environment,
      scopeType: item.scope_type,
      scopeId: item.scope_id,
      createdBy: item.created_by,
      updatedAt: item.updated_at,
      createdAt: item.created_at,
    });
  }
}

@Injectable()
export class PrismaAuditLogsRepository implements IAuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(log: AuditLog): Promise<AuditLog> {
    const created = await this.prisma.audit_logs.create({
      data: {
        id: log.id,
        actor_user_id: log.actorUserId,
        actor_role: log.actorRole,
        action: log.action,
        resource_type: log.resourceType,
        resource_id: log.resourceId,
        request_id: log.requestId,
        ip: log.ip,
        user_agent: log.userAgent,
        before_json: log.beforeJson,
        after_json: log.afterJson,
        reason: log.reason,
      },
    });
    return this.mapToDomain(created);
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: any;
  }): Promise<AuditLog[]> {
    const found = await this.prisma.audit_logs.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: { created_at: "desc" },
    });
    return found.map(this.mapToDomain);
  }

  private mapToDomain(item: any): AuditLog {
    return new AuditLog({
      id: item.id,
      actorUserId: item.actor_user_id,
      actorRole: item.actor_role,
      action: item.action,
      resourceType: item.resource_type,
      resourceId: item.resource_id,
      requestId: item.request_id,
      ip: item.ip,
      userAgent: item.user_agent,
      beforeJson: item.before_json,
      afterJson: item.after_json,
      reason: item.reason,
      createdAt: item.created_at,
    });
  }
}
