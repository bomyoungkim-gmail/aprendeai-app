export declare class CreateFeatureFlagDto {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    environment?: string;
    scopeType?: string;
    scopeId?: string;
}
export declare class UpdateFeatureFlagDto {
    name?: string;
    description?: string;
    enabled?: boolean;
    environment?: string;
    scopeType?: string;
    scopeId?: string;
}
export declare class ToggleFeatureFlagDto {
    enabled: boolean;
    reason?: string;
}
export declare class DeleteFeatureFlagDto {
    reason: string;
}
export declare class FeatureFlagFilterDto {
    environment?: string;
    enabled?: boolean;
}
