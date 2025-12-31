import { PrismaService } from "../prisma/prisma.service";
import { Environment } from "@prisma/client";
import { ManageFeatureFlagsUseCase } from "./application/use-cases/manage-feature-flags.use-case";
import { GetPlatformStatsUseCase } from "./application/use-cases/get-platform-stats.use-case";
import { AdminUserManagementUseCase } from "./application/use-cases/admin-user-management.use-case";
import { IFeatureFlagsRepository, IAuditLogsRepository } from "./domain/admin.repository.interface";
import { AuditLog } from "./domain/audit-log.entity";
export declare class AdminService {
    private readonly prisma;
    private readonly manageFlagsUseCase;
    private readonly getStatsUseCase;
    private readonly userManagementUseCase;
    private readonly flagsRepo;
    private readonly auditRepo;
    constructor(prisma: PrismaService, manageFlagsUseCase: ManageFeatureFlagsUseCase, getStatsUseCase: GetPlatformStatsUseCase, userManagementUseCase: AdminUserManagementUseCase, flagsRepo: IFeatureFlagsRepository, auditRepo: IAuditLogsRepository);
    listFeatureFlags(filter?: {
        environment?: Environment;
        enabled?: boolean;
    }): Promise<import("./domain/feature-flag.entity").FeatureFlag[]>;
    getFeatureFlag(id: string): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    createFeatureFlag(data: any, createdBy: string, actorRole: string): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    updateFeatureFlag(id: string, data: any, actorUserId: string, actorRole: string): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    toggleFeatureFlag(id: string, enabled: boolean, reason: string | undefined, actorUserId: string, actorRole: string): Promise<import("./domain/feature-flag.entity").FeatureFlag>;
    deleteFeatureFlag(id: string, reason: string, actorUserId: string, actorRole: string): Promise<{
        deleted: boolean;
    }>;
    evaluateFeatureFlag(key: string, userId?: string, institutionId?: string): Promise<{
        enabled: boolean;
        reason: string;
    }>;
    getPlatformStats(): Promise<{
        totalUsers: number;
        totalInstitutions: number;
        totalFamilies: number;
        totalContent: number;
        activeUsersThisWeek: number;
        newUsersThisMonth: number;
    }>;
    searchUsers(params: any): Promise<{
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
    updateUserStatus(userId: string, status: string, reason: string, actorUserId: string, actorRole: string): Promise<{
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
    createImpersonationToken(targetUserId: string, actorUserId: string, actorRole: string, reason: string, durationMinutes: number): Promise<{
        impersonationToken: string;
        expiresAt: Date;
        targetUser: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    listInstitutions(page?: number, limit?: number, search?: string): Promise<{
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
    getUserWithRoles(userId: string): Promise<{
        family_members: {
            families: {
                name: string;
            };
            role: import(".prisma/client").$Enums.FamilyRole;
            status: import(".prisma/client").$Enums.FamilyMemberStatus;
        }[];
        institution_members: {
            institutions: {
                name: string;
            };
            role: import(".prisma/client").$Enums.InstitutionRole;
            status: import(".prisma/client").$Enums.MemberStatus;
        };
        id: string;
        name: string;
        email: string;
        system_role: import(".prisma/client").$Enums.SystemRole;
        last_context_role: import(".prisma/client").$Enums.ContextRole;
        last_login_at: Date;
        status: string;
    }>;
    getUserDetail(userId: string): Promise<{
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
    updateUserRoles(userId: string, roles: any, reason: string, actorUserId: string, actorRole: string): Promise<{
        count: number;
    }>;
    createAuditLog(data: any): Promise<AuditLog>;
    getAuditLogs(params: any): Promise<AuditLog[]>;
}
