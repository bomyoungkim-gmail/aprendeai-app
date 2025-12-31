import { IApprovalsRepository } from "../../domain/approvals.repository.interface";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "../../../email/email.service";
import { AdminService } from "../../../admin/admin.service";
import { SubscriptionService } from "../../../billing/subscription.service";
export declare class ProcessUserApprovalUseCase {
    private readonly approvalsRepository;
    private readonly institutionsRepository;
    private readonly prisma;
    private readonly emailService;
    private readonly adminService;
    private readonly subscriptionService;
    constructor(approvalsRepository: IApprovalsRepository, institutionsRepository: IInstitutionsRepository, prisma: PrismaService, emailService: EmailService, adminService: AdminService, subscriptionService: SubscriptionService);
    approve(approvalId: string, reviewedBy: string): Promise<{
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
    reject(approvalId: string, reviewedBy: string, reason: string): Promise<{
        message: string;
    }>;
    private mapToContextRole;
}
