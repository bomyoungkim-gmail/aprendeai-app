import { FamilyRole, MemberStatus } from "@prisma/client";

export class Family {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
  members?: FamilyMember[];

  constructor(partial: Partial<Family>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }
}

export class FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
  status: MemberStatus;
  displayName?: string | null;
  joinedAt: Date;
  user?: {
    email: string;
    name: string;
  };

  constructor(partial: Partial<FamilyMember>) {
    Object.assign(this, partial);
    this.joinedAt = partial.joinedAt || new Date();
  }
}
