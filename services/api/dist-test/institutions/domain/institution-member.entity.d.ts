import { InstitutionRole } from "@prisma/client";
export declare class InstitutionMember {
    id: string;
    institutionId: string;
    userId: string;
    role: InstitutionRole;
    status: string;
    joinedAt: Date;
    constructor(partial: Partial<InstitutionMember>);
}
