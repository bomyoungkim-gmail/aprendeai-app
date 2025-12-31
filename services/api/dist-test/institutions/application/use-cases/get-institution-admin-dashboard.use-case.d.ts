import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { IApprovalsRepository } from "../../domain/approvals.repository.interface";
import { IInvitesRepository } from "../../domain/invites.repository.interface";
import { IDomainsRepository } from "../../domain/domains.repository.interface";
export declare class GetInstitutionAdminDashboardUseCase {
    private readonly institutionsRepository;
    private readonly approvalsRepository;
    private readonly invitesRepository;
    private readonly domainsRepository;
    constructor(institutionsRepository: IInstitutionsRepository, approvalsRepository: IApprovalsRepository, invitesRepository: IInvitesRepository, domainsRepository: IDomainsRepository);
    execute(userId: string): Promise<{
        memberCount: number;
        activeInvites: number;
        pendingApprovals: number;
        domains: string[];
        id: string;
        name: string;
        type: any;
        kind: any;
        city?: string | null;
        state?: string | null;
        country?: string | null;
        maxMembers?: number;
        requiresApproval?: boolean;
        slug?: string | null;
        ssoEnabled?: boolean;
        logoUrl?: string | null;
        settings?: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
