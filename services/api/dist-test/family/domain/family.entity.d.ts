import { FamilyRole, MemberStatus } from "@prisma/client";
export declare class Family {
    id: string;
    name: string;
    ownerUserId: string;
    createdAt: Date;
    updatedAt: Date;
    members?: FamilyMember[];
    constructor(partial: Partial<Family>);
}
export declare class FamilyMember {
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
    constructor(partial: Partial<FamilyMember>);
}
