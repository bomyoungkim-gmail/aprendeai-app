import { Injectable, Inject } from "@nestjs/common";
import { InstitutionDomainUseCase } from "./application/use-cases/institution-domain.use-case";
import { IDomainsRepository } from "./domain/domains.repository.interface";
import { AddDomainDto } from "./dto/institution.dto";

@Injectable()
export class InstitutionDomainService {
  constructor(
    private readonly domainUseCase: InstitutionDomainUseCase,
    @Inject(IDomainsRepository) private readonly repository: IDomainsRepository,
  ) {}

  async addDomain(institutionId: string, dto: AddDomainDto, addedBy: string) {
    return this.domainUseCase.addDomain(institutionId, dto, addedBy);
  }

  async findByInstitution(institutionId: string) {
    return this.repository.findByInstitution(institutionId);
  }

  async removeDomain(domainId: string, removedBy: string) {
    return this.domainUseCase.removeDomain(domainId, removedBy);
  }

  async findByEmail(email: string) {
    return this.domainUseCase.findByEmail(email);
  }
}
