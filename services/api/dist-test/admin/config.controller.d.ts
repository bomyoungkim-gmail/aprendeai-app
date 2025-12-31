import { ConfigService } from "./services/config.service";
import { AdminService } from "./admin.service";
import { ConfigFilterDto, CreateConfigDto, UpdateConfigDto, ValidateProviderDto } from "./dto/config.dto";
export declare class ConfigController {
    private configService;
    private adminService;
    constructor(configService: ConfigService, adminService: AdminService);
    getConfigs(filters: ConfigFilterDto): Promise<{
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
    getConfig(id: string, resolveSecrets?: string): Promise<{
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
    createConfig(dto: CreateConfigDto, req: any): Promise<{
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
    updateConfig(id: string, dto: UpdateConfigDto, req: any): Promise<{
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
    deleteConfig(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    validateProvider(provider: string, dto: ValidateProviderDto): Promise<{
        valid: boolean;
        warning: string;
        message?: undefined;
    } | {
        valid: boolean;
        message: string;
    }>;
    getConfigsByCategory(category: string, environment?: string): Promise<{
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
    clearLLMCache(provider?: string): Promise<{
        success: boolean;
        message: string;
        provider: string;
    }>;
}
