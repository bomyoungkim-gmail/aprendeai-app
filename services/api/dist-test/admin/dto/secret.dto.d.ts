export declare class CreateSecretDto {
    key: string;
    name: string;
    value: string;
    provider?: string;
    environment?: string;
}
export declare class UpdateSecretDto {
    value: string;
    reason: string;
}
export declare class DeleteSecretDto {
    reason: string;
}
export declare class SecretFilterDto {
    provider?: string;
    environment?: string;
}
