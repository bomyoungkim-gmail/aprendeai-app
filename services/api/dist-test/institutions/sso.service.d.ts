import { PrismaService } from "../prisma/prisma.service";
import { AdminService } from "../admin/admin.service";
import { SSOProvider } from "@prisma/client";
interface CreateSSOConfigDto {
    institutionId: string;
    provider: SSOProvider;
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    clientId?: string;
    clientSecret?: string;
    roleMapping?: any;
}
interface UpdateSSOConfigDto {
    enabled?: boolean;
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    clientId?: string;
    clientSecret?: string;
    roleMapping?: any;
}
export declare class SSOService {
    private prisma;
    private adminService;
    constructor(prisma: PrismaService, adminService: AdminService);
    createConfig(dto: CreateSSOConfigDto, createdBy: string): Promise<{
        provider: import(".prisma/client").$Enums.SSOProvider;
        id: string;
        created_at: Date;
        updated_at: Date;
        institution_id: string;
        enabled: boolean;
        client_id: string | null;
        entity_id: string | null;
        sso_url: string | null;
        certificate: string | null;
        client_secret: string | null;
        auth_url: string | null;
        token_url: string | null;
        user_info_url: string | null;
        email_attribute: string | null;
        name_attribute: string | null;
        role_attribute: string | null;
        role_mapping: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getConfig(institutionId: string): Promise<{
        clientSecret: string;
        certificate: string;
        institutions: {
            id: string;
            name: string;
        };
        provider: import(".prisma/client").$Enums.SSOProvider;
        id: string;
        created_at: Date;
        updated_at: Date;
        institution_id: string;
        enabled: boolean;
        client_id: string | null;
        entity_id: string | null;
        sso_url: string | null;
        client_secret: string | null;
        auth_url: string | null;
        token_url: string | null;
        user_info_url: string | null;
        email_attribute: string | null;
        name_attribute: string | null;
        role_attribute: string | null;
        role_mapping: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateConfig(institutionId: string, dto: UpdateSSOConfigDto, updatedBy: string): Promise<{
        provider: import(".prisma/client").$Enums.SSOProvider;
        id: string;
        created_at: Date;
        updated_at: Date;
        institution_id: string;
        enabled: boolean;
        client_id: string | null;
        entity_id: string | null;
        sso_url: string | null;
        certificate: string | null;
        client_secret: string | null;
        auth_url: string | null;
        token_url: string | null;
        user_info_url: string | null;
        email_attribute: string | null;
        name_attribute: string | null;
        role_attribute: string | null;
        role_mapping: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deleteConfig(institutionId: string, deletedBy: string): Promise<{
        message: string;
    }>;
    testConfig(institutionId: string): Promise<{
        valid: boolean;
        message: string;
        provider: import(".prisma/client").$Enums.SSOProvider;
    }>;
    private validateProviderConfig;
}
export {};
