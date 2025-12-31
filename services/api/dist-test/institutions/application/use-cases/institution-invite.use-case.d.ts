import { IInvitesRepository } from "../../domain/invites.repository.interface";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { EmailService } from "../../../email/email.service";
import { AdminService } from "../../../admin/admin.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateInviteDto } from "../../dto/institution.dto";
export declare class InstitutionInviteUseCase {
    private readonly invitesRepository;
    private readonly institutionsRepository;
    private readonly prisma;
    private readonly emailService;
    private readonly adminService;
    constructor(invitesRepository: IInvitesRepository, institutionsRepository: IInstitutionsRepository, prisma: PrismaService, emailService: EmailService, adminService: AdminService);
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
}
