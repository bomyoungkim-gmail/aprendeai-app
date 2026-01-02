import { GroupRole } from "@prisma/client";

export class StudyGroup {
  id: string;
  name: string;
  scopeType?: string;
  scopeId?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StudyGroup>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }
}

export class StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  status: string;
  joinedAt: Date;

  constructor(partial: Partial<StudyGroupMember>) {
    Object.assign(this, partial);
    this.joinedAt = partial.joinedAt || new Date();
  }
}
