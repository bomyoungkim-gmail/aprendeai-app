import { InstitutionRole } from "@prisma/client";

export class InstitutionMember {
  id: string;
  institutionId: string;
  userId: string;
  role: InstitutionRole;
  status: string;
  joinedAt: Date;

  constructor(partial: Partial<InstitutionMember>) {
    Object.assign(this, partial);
    this.joinedAt = partial.joinedAt || new Date();
  }
}
