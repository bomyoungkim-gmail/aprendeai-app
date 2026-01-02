import { InstitutionRole } from "@prisma/client";

export class PendingApproval {
  id: string;
  institutionId: string;
  email: string;
  name: string;
  tempPasswordHash: string;
  requestedRole: InstitutionRole;
  status: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;

  constructor(partial: Partial<PendingApproval>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
  }
}
