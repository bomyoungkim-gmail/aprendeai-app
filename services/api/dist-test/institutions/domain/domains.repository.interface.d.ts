export declare class InstitutionDomain {
    id: string;
    institutionId: string;
    domain: string;
    autoApprove: boolean;
    defaultRole: string;
    createdAt: Date;
    constructor(partial: Partial<InstitutionDomain>);
}
export interface IDomainsRepository {
    create(domain: InstitutionDomain): Promise<InstitutionDomain>;
    findByDomain(domain: string): Promise<InstitutionDomain | null>;
    findByInstitution(institutionId: string): Promise<InstitutionDomain[]>;
    findById(id: string): Promise<InstitutionDomain | null>;
    delete(id: string): Promise<void>;
    update(id: string, updates: Partial<InstitutionDomain>): Promise<InstitutionDomain>;
}
export declare const IDomainsRepository: unique symbol;
