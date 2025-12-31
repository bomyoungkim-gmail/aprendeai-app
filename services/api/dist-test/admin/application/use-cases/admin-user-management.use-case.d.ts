import { PrismaService } from "../../../prisma/prisma.service";
import { IAuditLogsRepository } from "../../domain/admin.repository.interface";
import { JwtService } from "@nestjs/jwt";
export declare class AdminUserManagementUseCase {
    private readonly prisma;
    private readonly jwtService;
    private readonly auditRepo;
    constructor(prisma: PrismaService, jwtService: JwtService, auditRepo: IAuditLogsRepository);
    searchUsers(params: {
        query?: string;
        status?: string;
        role?: string;
        institutionId?: string;
        page: number;
        limit: number;
    }): Promise<{
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
    updateUserStatus(userId: string, status: string, reason: string, actor: {
        userId: string;
        role: string;
    }): Promise<{
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
    updateUserRoles(userId: string, roles: Array<{
        role: string;
        scopeType?: string;
        scopeId?: string;
    }>, reason: string, actorUserId: string, actorRole: string): Promise<{
        count: number;
    }>;
    createImpersonationToken(targetUserId: string, actor: {
        userId: string;
        role: string;
    }, reason: string, durationMinutes: number): Promise<{
        impersonationToken: string;
        expiresAt: Date;
        targetUser: {
            id: string;
            name: string;
            email: string;
        };
    }>;
}
