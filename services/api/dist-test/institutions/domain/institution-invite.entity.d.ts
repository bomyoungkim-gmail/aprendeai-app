import { InstitutionRole } from "@prisma/client";
export declare class InstitutionInvite {
    id: string;
    institutionId: string;
    email: string;
    role: InstitutionRole;
    token: string;
    expiresAt: Date;
    invitedBy: string;
    usedAt?: Date;
    createdAt: Date;
    constructor(partial: Partial<InstitutionInvite>);
    isExpired(): boolean;
    isUsed(): boolean;
}
