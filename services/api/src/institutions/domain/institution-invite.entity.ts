import { InstitutionRole } from "@prisma/client";

export class InstitutionInvite {
  id: string;
  institutionId: string;
  email: string;
  role: InstitutionRole;
  token: string;
  expiresAt: Date;
  invitedBy: string;
  usedAt?: Date;
  createdAt: Date;

  constructor(partial: Partial<InstitutionInvite>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isUsed(): boolean {
    return !!this.usedAt;
  }
}
