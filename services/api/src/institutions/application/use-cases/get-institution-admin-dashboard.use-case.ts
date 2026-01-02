import { Injectable, Inject, ForbiddenException } from "@nestjs/common";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { IApprovalsRepository } from "../../domain/approvals.repository.interface";
import { IInvitesRepository } from "../../domain/invites.repository.interface";
import { IDomainsRepository } from "../../domain/domains.repository.interface";

@Injectable()
export class GetInstitutionAdminDashboardUseCase {
  constructor(
    @Inject(IInstitutionsRepository)
    private readonly institutionsRepository: IInstitutionsRepository,
    @Inject(IApprovalsRepository)
    private readonly approvalsRepository: IApprovalsRepository,
    @Inject(IInvitesRepository)
    private readonly invitesRepository: IInvitesRepository,
    @Inject(IDomainsRepository)
    private readonly domainsRepository: IDomainsRepository,
  ) {}

  async execute(userId: string) {
    const adminMember =
      await this.institutionsRepository.findAdminMember(userId);

    if (!adminMember) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const institutionId = adminMember.institutionId;

    const [memberCount, activeInvites, pendingApprovals, domains] =
      await Promise.all([
        this.institutionsRepository.countMembers(institutionId, "ACTIVE"),
        this.invitesRepository.countActive(institutionId),
        this.approvalsRepository.countPending(institutionId),
        this.domainsRepository.findByInstitution(institutionId),
      ]);

    return {
      ...adminMember.institutions,
      memberCount,
      activeInvites,
      pendingApprovals,
      domains: domains.map((d) => d.domain),
    };
  }
}
