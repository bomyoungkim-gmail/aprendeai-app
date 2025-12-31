import { PrismaService } from "../../prisma/prisma.service";
import { SecretService } from "./secret.service";
import { ConfigType, Environment } from "@prisma/client";
import { LLMConfigService } from "../../llm/llm-config.service";
export declare class ConfigService {
    private prisma;
    private secretService;
    private llmConfigService;
    constructor(prisma: PrismaService, secretService: SecretService, llmConfigService: LLMConfigService);
    getConfigs(filters: {
        category?: string;
        environment?: Environment;
    }): Promise<{
        value: string;
        description: string | null;
        id: string;
        key: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }[]>;
    getConfig(id: string, resolveSecrets?: boolean): Promise<{
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    } | {
        resolvedValue: string;
        secretName: string;
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    } | {
        resolvedValue: any;
        error: string;
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    getConfigByKey(key: string, environment?: Environment): Promise<{
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    createConfig(data: {
        key: string;
        value: string;
        type: ConfigType;
        category: string;
        environment?: Environment;
        description?: string;
        metadata?: any;
    }, userId: string): Promise<{
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    updateConfig(id: string, data: {
        value?: string;
        description?: string;
        metadata?: any;
    }, userId: string): Promise<{
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    deleteConfig(id: string): Promise<{
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    validateProvider(provider: string, config: any): Promise<{
        valid: boolean;
        warning: string;
        message?: undefined;
    } | {
        valid: boolean;
        message: string;
    }>;
    private validateOpenAI;
    private validateKCI;
    private validateAWS;
    getConfigsByCategory(category: string, environment?: Environment): Promise<{
        description: string | null;
        id: string;
        key: string;
        value: string;
        type: import(".prisma/client").$Enums.ConfigType;
        category: string;
        environment: import(".prisma/client").$Enums.Environment | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
    }[]>;
    clearLLMCache(provider?: string): Promise<void>;
}
