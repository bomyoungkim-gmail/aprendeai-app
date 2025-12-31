import { FeatureFlag, FeatureFlagEnvironment } from "./feature-flag.entity";
import { AuditLog } from "./audit-log.entity";
export interface IFeatureFlagsRepository {
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
}
export declare const IFeatureFlagsRepository: unique symbol;
export interface IAuditLogsRepository {
    create(log: AuditLog): Promise<AuditLog>;
    findMany(params: {
        skip?: number;
        take?: number;
        where?: any;
    }): Promise<AuditLog[]>;
}
export declare const IAuditLogsRepository: unique symbol;
