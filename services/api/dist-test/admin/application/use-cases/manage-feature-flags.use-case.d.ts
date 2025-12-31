import { IFeatureFlagsRepository, IAuditLogsRepository } from "../../domain/admin.repository.interface";
import { FeatureFlag, FeatureFlagEnvironment, FeatureFlagScopeType } from "../../domain/feature-flag.entity";
export declare class ManageFeatureFlagsUseCase {
    private readonly flagsRepo;
    private readonly auditRepo;
    constructor(flagsRepo: IFeatureFlagsRepository, auditRepo: IAuditLogsRepository);
    create(data: {
        key: string;
        name: string;
        description?: string;
        enabled: boolean;
        environment?: FeatureFlagEnvironment;
        scopeType?: FeatureFlagScopeType;
        scopeId?: string;
    }, actor: {
        userId: string;
        role: string;
    }): Promise<FeatureFlag>;
    update(id: string, data: Partial<FeatureFlag>, actor: {
        userId: string;
        role: string;
    }): Promise<FeatureFlag>;
    toggle(id: string, enabled: boolean, reason: string | undefined, actor: {
        userId: string;
        role: string;
    }): Promise<FeatureFlag>;
    delete(id: string, reason: string, actor: {
        userId: string;
        role: string;
    }): Promise<void>;
    list(filter?: {
        environment?: FeatureFlagEnvironment;
        enabled?: boolean;
    }): Promise<FeatureFlag[]>;
    get(id: string): Promise<FeatureFlag>;
}
