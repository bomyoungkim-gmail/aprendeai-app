import { AdminService } from "./admin.service";
import { SecretService } from "./services/secret.service";
import { UserSearchDto, UpdateUserStatusDto, UpdateUserRolesDto, ImpersonateUserDto } from "./dto/user-management.dto";
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, ToggleFeatureFlagDto, DeleteFeatureFlagDto, FeatureFlagFilterDto } from "./dto/feature-flag.dto";
export declare class AdminController {
    private adminService;
    private secretService;
    constructor(adminService: AdminService, secretService: SecretService);
    getAdminMe(req: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            system_role: import(".prisma/client").$Enums.SystemRole;
            context_role: import(".prisma/client").$Enums.ContextRole;
            status: string;
            lastLoginAt: Date;
        };
        institution_members: {
            institutions: {
                name: string;
            };
            role: import(".prisma/client").$Enums.InstitutionRole;
            status: import(".prisma/client").$Enums.MemberStatus;
        };
        family_members: {
            families: {
                name: string;
            };
            role: import(".prisma/client").$Enums.FamilyRole;
            status: import(".prisma/client").$Enums.FamilyMemberStatus;
        }[];
        permissions: string[];
    }>;
    getPlatformStats(): Promise<{
        totalUsers: number;
        totalInstitutions: number;
        totalFamilies: number;
        totalContent: number;
        activeUsersThisWeek: number;
        newUsersThisMonth: number;
    }>;
    listInstitutions(page?: string, limit?: string, search?: string): Promise<{
        data: ({
            _count: {
                institution_members: number;
                domains: number;
            };
        } & {
            id: string;
            type: import(".prisma/client").$Enums.InstitutionType;
            created_at: Date;
            updated_at: Date;
            name: string;
            kind: import(".prisma/client").$Enums.InstitutionKind;
            city: string | null;
            state: string | null;
            country: string | null;
            max_members: number | null;
            requires_approval: boolean;
            slug: string | null;
            sso_enabled: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    searchUsers(searchDto: UserSearchDto): Promise<{
        users: {
            institutions: {
                id: string;
                name: string;
            };
            id: string;
            created_at: Date;
            name: string;
            email: string;
            system_role: import(".prisma/client").$Enums.SystemRole;
            last_context_role: import(".prisma/client").$Enums.ContextRole;
            last_institution_id: string;
            last_login_at: Date;
            status: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserDetail(id: string): Promise<{
        family_members: {
            id: string;
            role: import(".prisma/client").$Enums.FamilyRole;
            status: import(".prisma/client").$Enums.FamilyMemberStatus;
            user_id: string;
            joined_at: Date;
            family_id: string;
            learning_role: import(".prisma/client").$Enums.FamilyLearningRole | null;
            display_name: string | null;
        }[];
        institution_members: {
            id: string;
            role: import(".prisma/client").$Enums.InstitutionRole;
            institution_id: string;
            status: import(".prisma/client").$Enums.MemberStatus;
            user_id: string;
            joined_at: Date;
            left_at: Date | null;
        };
        institutions: {
            id: string;
            type: import(".prisma/client").$Enums.InstitutionType;
            created_at: Date;
            updated_at: Date;
            name: string;
            kind: import(".prisma/client").$Enums.InstitutionKind;
            city: string | null;
            state: string | null;
            country: string | null;
            max_members: number | null;
            requires_approval: boolean;
            slug: string | null;
            sso_enabled: boolean;
        };
        _count: {
            reading_sessions: number;
            assessment_attempts: number;
            contents_created_by: number;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        email: string;
        bio: string | null;
        address: string | null;
        sex: string | null;
        birthday: Date | null;
        age: number | null;
        password_hash: string | null;
        system_role: import(".prisma/client").$Enums.SystemRole | null;
        last_context_role: import(".prisma/client").$Enums.ContextRole;
        last_institution_id: string | null;
        oauth_provider: string | null;
        oauth_id: string | null;
        oauth_picture: string | null;
        schooling_level: string | null;
        preferred_languages: import("@prisma/client/runtime/library").JsonValue;
        last_login_at: Date | null;
        status: string;
        avatar_url: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        sso_provider: string | null;
        sso_subject: string | null;
        password_reset_token: string | null;
        password_reset_expires: Date | null;
    }>;
    updateUserStatus(id: string, dto: UpdateUserStatusDto, req: any): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        email: string;
        bio: string | null;
        address: string | null;
        sex: string | null;
        birthday: Date | null;
        age: number | null;
        password_hash: string | null;
        system_role: import(".prisma/client").$Enums.SystemRole | null;
        last_context_role: import(".prisma/client").$Enums.ContextRole;
        last_institution_id: string | null;
        oauth_provider: string | null;
        oauth_id: string | null;
        oauth_picture: string | null;
        schooling_level: string | null;
        preferred_languages: import("@prisma/client/runtime/library").JsonValue;
        last_login_at: Date | null;
        status: string;
        avatar_url: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        sso_provider: string | null;
        sso_subject: string | null;
        password_reset_token: string | null;
        password_reset_expires: Date | null;
    }>;
    updateUserRoles(id: string, dto: UpdateUserRolesDto, req: any): Promise<{
        count: number;
    }>;
    impersonateUser(id: string, dto: ImpersonateUserDto, req: any): Promise<{
        impersonationToken: string;
        expiresAt: Date;
        targetUser: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    listFeatureFlags(filter: FeatureFlagFilterDto): Promise<import("./domain/feature-flag.entity").FeatureFlag[]>;
    getFeatureFlag(id: string): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    createFeatureFlag(dto: CreateFeatureFlagDto, req: any): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    updateFeatureFlag(id: string, dto: UpdateFeatureFlagDto, req: any): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    toggleFeatureFlag(id: string, dto: ToggleFeatureFlagDto, req: any): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    deleteFeatureFlag(id: string, dto: DeleteFeatureFlagDto, req: any): Promise<{
        deleted: boolean;
    }>;
    listSecrets(filter: any): Promise<{
        maskedValue: string;
        provider: string;
        id: string;
        key: string;
        environment: import(".prisma/client").$Enums.Environment;
        created_at: Date;
        updated_at: Date;
        name: string;
        last_rotated_at: Date;
    }[]>;
    getSecret(id: string, req: any): Promise<{
        id: string;
        key: string;
        name: string;
        value: string;
        provider: string;
        environment: import(".prisma/client").$Enums.Environment;
        lastRotatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createSecret(dto: any, req: any): Promise<{
        id: string;
        key: string;
        name: string;
        maskedValue: string;
    }>;
    updateSecret(id: string, dto: any, req: any): Promise<{
        id: string;
        key: string;
        name: string;
        maskedValue: string;
        lastRotatedAt: Date;
    }>;
    deleteSecret(id: string, dto: any, req: any): Promise<{
        deleted: boolean;
    }>;
    getAuditLogs(page?: string, limit?: string, action?: string, userId?: string, startDate?: string, endDate?: string): Promise<{
        data: import("./domain/audit-log.entity").AuditLog[];
        pagination: {
            page: number;
            limit: number;
        };
    }>;
    getAIMetrics(): Promise<{
        success: boolean;
        data: any;
        fetched_at: string;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        error: string;
        message: any;
        data: any;
        fetched_at?: undefined;
    }>;
    private getPermissionsForRole;
}
