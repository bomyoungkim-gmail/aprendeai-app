import { InstitutionInviteUseCase } from "./application/use-cases/institution-invite.use-case";
import { IInvitesRepository } from "./domain/invites.repository.interface";
import { CreateInviteDto } from "./dto/institution.dto";
export declare class InstitutionInviteService {
    private readonly inviteUseCase;
    private readonly repository;
    constructor(inviteUseCase: InstitutionInviteUseCase, repository: IInvitesRepository);
    create(institutionId: string, dto: CreateInviteDto, invitedBy: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.InstitutionRole;
        expiresAt: Date;
        inviteUrl: string;
    }>;
    validate(token: string): Promise<{
        valid: boolean;
        message: string;
        id?: undefined;
        institutionId?: undefined;
        institutionName?: undefined;
        email?: undefined;
        role?: undefined;
        expiresAt?: undefined;
    } | {
        valid: boolean;
        id: string;
        institutionId: string;
        institutionName: string;
        email: string;
        role: import(".prisma/client").$Enums.InstitutionRole;
        expiresAt: Date;
        message?: undefined;
    }>;
    markAsUsed(inviteId: string): Promise<import("./domain/institution-invite.entity").InstitutionInvite>;
    findByInstitution(institutionId: string): Promise<import("./domain/institution-invite.entity").InstitutionInvite[]>;
    findByToken(token: string): Promise<{
        valid: boolean;
        message: string;
        id?: undefined;
        institutionId?: undefined;
        institutionName?: undefined;
        email?: undefined;
        role?: undefined;
        expiresAt?: undefined;
    } | {
        valid: boolean;
        id: string;
        institutionId: string;
        institutionName: string;
        email: string;
        role: import(".prisma/client").$Enums.InstitutionRole;
        expiresAt: Date;
        message?: undefined;
    }>;
    delete(inviteId: string, deletedBy: string): Promise<{
        message: string;
    }>;
}
