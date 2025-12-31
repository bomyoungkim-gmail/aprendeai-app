import { IDomainsRepository, InstitutionDomain } from "../../domain/domains.repository.interface";
import { AdminService } from "../../../admin/admin.service";
import { IUsersRepository } from "../../../users/domain/users.repository.interface";
import { AddDomainDto } from "../../dto/institution.dto";
export declare class InstitutionDomainUseCase {
    private readonly domainsRepository;
    private readonly adminService;
    private readonly usersRepository;
    constructor(domainsRepository: IDomainsRepository, adminService: AdminService, usersRepository: IUsersRepository);
    addDomain(institutionId: string, dto: AddDomainDto, addedBy: string): Promise<InstitutionDomain>;
    removeDomain(domainId: string, removedBy: string): Promise<{
        message: string;
    }>;
    findByEmail(email: string): Promise<InstitutionDomain>;
}
