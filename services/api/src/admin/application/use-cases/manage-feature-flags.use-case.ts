import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  IFeatureFlagsRepository,
  IAuditLogsRepository,
} from "../../domain/admin.repository.interface";
import {
  FeatureFlag,
  FeatureFlagEnvironment,
  FeatureFlagScopeType,
} from "../../domain/feature-flag.entity";
import { AuditLog } from "../../domain/audit-log.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ManageFeatureFlagsUseCase {
  constructor(
    @Inject(IFeatureFlagsRepository)
    private readonly flagsRepo: IFeatureFlagsRepository,
    @Inject(IAuditLogsRepository)
    private readonly auditRepo: IAuditLogsRepository,
  ) {}

  async create(
    data: {
      key: string;
      name: string;
      description?: string;
      enabled: boolean;
      environment?: FeatureFlagEnvironment;
      scopeType?: FeatureFlagScopeType;
      scopeId?: string;
    },
    actor: { userId: string; role: string },
  ): Promise<FeatureFlag> {
    const existing = await this.flagsRepo.findByKey(data.key);
    if (existing) {
      throw new BadRequestException(
        `Feature flag with key "${data.key}" already exists`,
      );
    }

    const flag = new FeatureFlag({
      id: uuidv4(),
      ...data,
      createdBy: actor.userId,
    });

    const created = await this.flagsRepo.create(flag);

    await this.auditRepo.create(
      new AuditLog({
        id: uuidv4(),
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "FEATURE_FLAG_CREATED",
        resourceType: "FEATURE_FLAG",
        resourceId: created.id,
        afterJson: created,
      }),
    );

    return created;
  }

  async update(
    id: string,
    data: Partial<FeatureFlag>,
    actor: { userId: string; role: string },
  ): Promise<FeatureFlag> {
    const existing = await this.flagsRepo.findById(id);
    if (!existing) throw new NotFoundException("Feature flag not found");

    const updated = await this.flagsRepo.update(id, data);

    await this.auditRepo.create(
      new AuditLog({
        id: uuidv4(),
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "FEATURE_FLAG_UPDATED",
        resourceType: "FEATURE_FLAG",
        resourceId: id,
        beforeJson: existing,
        afterJson: updated,
      }),
    );

    return updated;
  }

  async toggle(
    id: string,
    enabled: boolean,
    reason: string | undefined,
    actor: { userId: string; role: string },
  ): Promise<FeatureFlag> {
    const existing = await this.flagsRepo.findById(id);
    if (!existing) throw new NotFoundException("Feature flag not found");

    const updated = await this.flagsRepo.update(id, { enabled });

    await this.auditRepo.create(
      new AuditLog({
        id: uuidv4(),
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "FEATURE_FLAG_TOGGLED",
        resourceType: "FEATURE_FLAG",
        resourceId: id,
        beforeJson: { enabled: existing.enabled },
        afterJson: { enabled: updated.enabled },
        reason,
      }),
    );

    return updated;
  }

  async delete(
    id: string,
    reason: string,
    actor: { userId: string; role: string },
  ): Promise<void> {
    const existing = await this.flagsRepo.findById(id);
    if (!existing) return; // Idempotent or throw? Code used idempotent-ish style before but with checks.

    await this.flagsRepo.delete(id);

    await this.auditRepo.create(
      new AuditLog({
        id: uuidv4(),
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "FEATURE_FLAG_DELETED",
        resourceType: "FEATURE_FLAG",
        resourceId: id,
        beforeJson: existing,
        reason,
      }),
    );
  }

  async list(filter?: {
    environment?: FeatureFlagEnvironment;
    enabled?: boolean;
  }) {
    return this.flagsRepo.findMany(filter);
  }

  async get(id: string) {
    return this.flagsRepo.findById(id);
  }
}
