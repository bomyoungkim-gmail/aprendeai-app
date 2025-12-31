import { InstitutionDomainUseCase } from "./application/use-cases/institution-domain.use-case";
import { IDomainsRepository } from "./domain/domains.repository.interface";
import { AddDomainDto } from "./dto/institution.dto";
export declare class InstitutionDomainService {
    private readonly domainUseCase;
    private readonly repository;
    constructor(domainUseCase: InstitutionDomainUseCase, repository: IDomainsRepository);
    addDomain(institutionId: string, dto: AddDomainDto, addedBy: string): Promise<import("./domain/domains.repository.interface").InstitutionDomain>;
    findByInstitution(institutionId: string): Promise<import("./domain/domains.repository.interface").InstitutionDomain[]>;
    removeDomain(domainId: string, removedBy: string): Promise<{
        message: string;
    }>;
    findByEmail(email: string): Promise<import("./domain/domains.repository.interface").InstitutionDomain>;
}
