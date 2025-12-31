import { FamilyRole } from "@prisma/client";
export declare class InviteMemberDto {
    email: string;
    role: FamilyRole;
    displayName?: string;
}
