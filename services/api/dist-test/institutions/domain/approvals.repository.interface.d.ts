import { PendingApproval } from "./pending-approval.entity";
export interface IApprovalsRepository {
    create(approval: PendingApproval): Promise<PendingApproval>;
    findById(id: string): Promise<PendingApproval | null>;
    findByInstitution(institutionId: string, status?: string): Promise<PendingApproval[]>;
    update(id: string, updates: Partial<PendingApproval>): Promise<PendingApproval>;
    countPending(institutionId: string): Promise<number>;
}
export declare const IApprovalsRepository: unique symbol;
