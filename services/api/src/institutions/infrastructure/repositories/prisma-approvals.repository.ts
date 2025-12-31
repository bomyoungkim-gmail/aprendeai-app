import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IApprovalsRepository } from "../../domain/approvals.repository.interface";
import { PendingApproval } from "../../domain/pending-approval.entity";

@Injectable()
export class PrismaApprovalsRepository implements IApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(approval: PendingApproval): Promise<PendingApproval> {
    const created = await this.prisma.pending_user_approvals.create({
      data: {
        id: approval.id,
        institution_id: approval.institutionId,
        email: approval.email,
        name: approval.name,
        temp_password_hash: approval.tempPasswordHash,
        requested_role: approval.requestedRole,
        status: approval.status as any,
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<PendingApproval | null> {
    const found = await this.prisma.pending_user_approvals.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByInstitution(institutionId: string, status?: string): Promise<PendingApproval[]> {
    const all = await this.prisma.pending_user_approvals.findMany({
      where: { institution_id: institutionId, status: status as any },
      orderBy: { created_at: "asc" },
    });
    return all.map(this.mapToDomain);
  }

  async update(id: string, updates: Partial<PendingApproval>): Promise<PendingApproval> {
    const updated = await this.prisma.pending_user_approvals.update({
      where: { id },
      data: {
        status: updates.status as any,
        reviewed_by: updates.reviewedBy,
        reviewed_at: updates.reviewedAt,
        rejection_reason: updates.rejectionReason,
      },
    });
    return this.mapToDomain(updated);
  }

  async countPending(institutionId: string): Promise<number> {
    return this.prisma.pending_user_approvals.count({
      where: { institution_id: institutionId, status: "PENDING" },
    });
  }

  private mapToDomain(item: any): PendingApproval {
    return new PendingApproval({
      id: item.id,
      institutionId: item.institution_id,
      email: item.email,
      name: item.name,
      tempPasswordHash: item.temp_password_hash,
      requestedRole: item.requested_role,
      status: item.status,
      rejectionReason: item.rejection_reason,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
    });
  }
}
