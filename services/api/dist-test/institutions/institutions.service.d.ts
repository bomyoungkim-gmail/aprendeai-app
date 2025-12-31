import { IInstitutionsRepository } from "./domain/institutions.repository.interface";
import { GetInstitutionAdminDashboardUseCase } from "./application/use-cases/get-institution-admin-dashboard.use-case";
import { CreateInstitutionDto, UpdateInstitutionDto } from "./dto/institution.dto";
import { Institution } from "./domain/institution.entity";
export declare class InstitutionsService {
    private readonly repository;
    private readonly getAdminDashboardUseCase;
    constructor(repository: IInstitutionsRepository, getAdminDashboardUseCase: GetInstitutionAdminDashboardUseCase);
    create(dto: CreateInstitutionDto): Promise<Institution>;
    findAll(): Promise<Institution[]>;
    findOne(id: string): Promise<Institution>;
    update(id: string, dto: UpdateInstitutionDto): Promise<Institution>;
    remove(id: string): Promise<void>;
    getInstitutionForAdmin(userId: string): Promise<{
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
