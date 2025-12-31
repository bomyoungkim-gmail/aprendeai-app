import { PrismaService } from "../../../prisma/prisma.service";
import { IFeatureFlagsRepository, IAuditLogsRepository } from "../../domain/admin.repository.interface";
import { FeatureFlag, FeatureFlagEnvironment } from "../../domain/feature-flag.entity";
import { AuditLog } from "../../domain/audit-log.entity";
export declare class PrismaFeatureFlagsRepository implements IFeatureFlagsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(flag: FeatureFlag): Promise<FeatureFlag>;
    update(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<FeatureFlag | null>;
    findByKey(key: string): Promise<FeatureFlag | null>;
    findMany(filter?: {
        environment?: FeatureFlagEnvironment;
        enabled?: boolean;
    }): Promise<FeatureFlag[]>;
    evaluate(key: string, environment: FeatureFlagEnvironment, userId?: string, institutionId?: string): Promise<FeatureFlag | null>;
    private mapToDomain;
}
export declare class PrismaAuditLogsRepository implements IAuditLogsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(log: AuditLog): Promise<AuditLog>;
    findMany(params: {
        skip?: number;
        take?: number;
        where?: any;
    }): Promise<AuditLog[]>;
    private mapToDomain;
}
