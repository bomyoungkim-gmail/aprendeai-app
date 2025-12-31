import { ConfigType, Environment } from "@prisma/client";
export declare class ConfigFilterDto {
    category?: string;
    environment?: Environment;
}
export declare class CreateConfigDto {
    key: string;
    value: string;
    type: ConfigType;
    category: string;
    environment?: Environment;
    description?: string;
    metadata?: any;
}
export declare class UpdateConfigDto {
    value?: string;
    description?: string;
    metadata?: any;
}
export declare class ValidateProviderDto {
    config: any;
}
