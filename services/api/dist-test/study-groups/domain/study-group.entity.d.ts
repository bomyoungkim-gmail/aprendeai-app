import { GroupRole } from "@prisma/client";
export declare class StudyGroup {
    id: string;
    name: string;
    scopeType?: string;
    scopeId?: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<StudyGroup>);
}
export declare class StudyGroupMember {
    id: string;
    groupId: string;
    userId: string;
    role: GroupRole;
    status: string;
    joinedAt: Date;
    constructor(partial: Partial<StudyGroupMember>);
}
