import { Injectable, Inject, ConflictException, BadRequestException } from "@nestjs/common";
import { IDomainsRepository, InstitutionDomain } from "../../domain/domains.repository.interface";
import { AdminService } from "../../../admin/admin.service";
import { IUsersRepository } from "../../../users/domain/users.repository.interface";
import { AddDomainDto } from "../../dto/institution.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class InstitutionDomainUseCase {
  constructor(
    @Inject(IDomainsRepository) private readonly domainsRepository: IDomainsRepository,
    private readonly adminService: AdminService,
    @Inject(IUsersRepository) private readonly usersRepository: IUsersRepository,
  ) {}

  async addDomain(institutionId: string, dto: AddDomainDto, addedBy: string) {
    const domainPattern = /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainPattern.test(dto.domain)) {
      throw new BadRequestException("Invalid domain format. Must be @domain.com");
    }

    const existing = await this.domainsRepository.findByDomain(dto.domain);
    if (existing) {
      throw new ConflictException("Domain already registered to another institution");
    }

    const domain = new InstitutionDomain({
      id: uuidv4(),
      institutionId,
      domain: dto.domain.toLowerCase(),
      autoApprove: dto.autoApprove,
      defaultRole: dto.defaultRole,
    });

    const created = await this.domainsRepository.create(domain);

    await this.adminService.createAuditLog({
      actorUserId: addedBy,
      action: "ADD_INSTITUTION_DOMAIN",
      resourceType: "InstitutionDomain",
      resourceId: created.id,
      afterJson: dto,
    });

    return created;
  }

  async removeDomain(domainId: string, removedBy: string) {
    const domain = await this.domainsRepository.findById(domainId);
    if (!domain) {
      throw new BadRequestException("Domain not found");
    }

    // Check if there are users with this domain
    const usersCount = await this.usersRepository.countUsersByDomain(
      domain.domain.substring(1),
      domain.institutionId
    );

    if (usersCount > 0) {
      throw new ConflictException(`Cannot remove domain with ${usersCount} active users`);
    }

    await this.domainsRepository.delete(domainId);

    await this.adminService.createAuditLog({
      actorUserId: removedBy,
      action: "REMOVE_INSTITUTION_DOMAIN",
      resourceType: "InstitutionDomain",
      resourceId: domainId,
      beforeJson: domain,
    });

    return { message: "Domain removed successfully" };
  }

  async findByEmail(email: string) {
    const domainPart = email.split("@")[1];
    if (!domainPart) return null;
    return this.domainsRepository.findByDomain(`@${domainPart}`);
  }
}
