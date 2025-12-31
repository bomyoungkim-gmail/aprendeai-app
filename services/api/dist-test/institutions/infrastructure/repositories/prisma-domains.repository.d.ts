import { PrismaService } from "../../../prisma/prisma.service";
import { IDomainsRepository, InstitutionDomain } from "../../domain/domains.repository.interface";
export declare class PrismaDomainsRepository implements IDomainsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(domain: InstitutionDomain): Promise<InstitutionDomain>;
    findByDomain(domain: string): Promise<InstitutionDomain | null>;
    findByInstitution(institutionId: string): Promise<InstitutionDomain[]>;
    findById(id: string): Promise<InstitutionDomain | null>;
    delete(id: string): Promise<void>;
    update(id: string, updates: Partial<InstitutionDomain>): Promise<InstitutionDomain>;
    private mapToDomain;
}
