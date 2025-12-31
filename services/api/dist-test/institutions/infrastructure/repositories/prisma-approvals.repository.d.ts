import { PrismaService } from "../../../prisma/prisma.service";
import { IApprovalsRepository } from "../../domain/approvals.repository.interface";
import { PendingApproval } from "../../domain/pending-approval.entity";
export declare class PrismaApprovalsRepository implements IApprovalsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(approval: PendingApproval): Promise<PendingApproval>;
    findById(id: string): Promise<PendingApproval | null>;
    findByInstitution(institutionId: string, status?: string): Promise<PendingApproval[]>;
    update(id: string, updates: Partial<PendingApproval>): Promise<PendingApproval>;
    countPending(institutionId: string): Promise<number>;
    private mapToDomain;
}
