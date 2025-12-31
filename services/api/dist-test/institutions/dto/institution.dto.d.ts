import { InstitutionType, ContextRole } from "@prisma/client";
export declare class CreateInstitutionDto {
    name: string;
    type: InstitutionType;
    slug?: string;
    city?: string;
    state?: string;
    country?: string;
    maxMembers?: number;
    requiresApproval?: boolean;
}
export declare class UpdateInstitutionDto {
    name?: string;
    type?: InstitutionType;
    slug?: string;
    city?: string;
    state?: string;
    country?: string;
    maxMembers?: number;
    requiresApproval?: boolean;
    ssoEnabled?: boolean;
}
export declare class CreateInviteDto {
    email: string;
    role: ContextRole;
    expiresInDays?: number;
}
export declare class RegisterWithInviteDto {
    token: string;
    name: string;
    password: string;
}
export declare class AddDomainDto {
    domain: string;
    autoApprove: boolean;
    defaultRole: ContextRole;
}
export declare class ProcessApprovalDto {
    approve: boolean;
    reason?: string;
}
