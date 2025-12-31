export type FeatureFlagEnvironment = 'DEV' | 'STAGE' | 'PROD';
export type FeatureFlagScopeType = 'GLOBAL' | 'INSTITUTION' | 'USER';
export declare class FeatureFlag {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    enabled: boolean;
    environment?: FeatureFlagEnvironment | null;
    scopeType?: FeatureFlagScopeType | null;
    scopeId?: string | null;
    createdBy: string;
    updatedAt: Date;
    createdAt: Date;
    constructor(partial: Partial<FeatureFlag>);
}
