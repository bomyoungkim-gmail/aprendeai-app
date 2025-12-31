import { Injectable, Inject, ConflictException, NotFoundException } from "@nestjs/common";
import { IInvitesRepository } from "../../domain/invites.repository.interface";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { EmailService } from "../../../email/email.service";
import { AdminService } from "../../../admin/admin.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { InstitutionInvite } from "../../domain/institution-invite.entity";
import { CreateInviteDto } from "../../dto/institution.dto";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class InstitutionInviteUseCase {
  constructor(
    @Inject(IInvitesRepository) private readonly invitesRepository: IInvitesRepository,
    @Inject(IInstitutionsRepository) private readonly institutionsRepository: IInstitutionsRepository,
    private readonly prisma: PrismaService, // For checking existing user
    private readonly emailService: EmailService,
    private readonly adminService: AdminService,
  ) {}

  async create(institutionId: string, dto: CreateInviteDto, invitedBy: string) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    await this.invitesRepository.invalidatePrevious(institutionId, dto.email);

    const invite = new InstitutionInvite({
      id: uuidv4(),
      institutionId,
      email: dto.email.toLowerCase(),
      role: dto.role as any,
      token,
      expiresAt,
      invitedBy,
    });

    const created = await this.invitesRepository.create(invite);
    const institution = await this.institutionsRepository.findById(institutionId);

    // Fetch inviter info for email
    const inviter = await this.prisma.users.findUnique({
        where: { id: invitedBy },
        select: { name: true }
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/register/invite?token=${token}`;

    await this.emailService.sendEmail({
      to: dto.email,
      subject: `Convite para ${institution?.name}`,
      template: "institution-invite",
      context: {
        institutionName: institution?.name,
        inviterName: inviter?.name,
        inviteUrl,
        expiresAt,
        role: dto.role as any,
      },
    });

    await this.adminService.createAuditLog({
      actorUserId: invitedBy,
      action: "INVITE_TO_INSTITUTION",
      resourceType: "InstitutionInvite",
      resourceId: created.id,
      afterJson: {
        email: dto.email,
        role: dto.role,
        institutionId,
        expiresAt,
      },
    });

    return {
      id: created.id,
      email: created.email,
      role: created.role,
      expiresAt: created.expiresAt,
      inviteUrl,
    };
  }

  async validate(token: string) {
    const invite = await this.invitesRepository.findByToken(token);

    if (!invite) {
      return { valid: false, message: "Invalid token" };
    }

    if (invite.isUsed()) {
      return { valid: false, message: "Invite already used" };
    }

    if (invite.isExpired()) {
      return { valid: false, message: "Invite expired" };
    }

    // Need to get institution name for response
    const institution = await this.institutionsRepository.findById(invite.institutionId);

    return {
      valid: true,
      id: invite.id,
      institutionId: invite.institutionId,
      institutionName: institution?.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }
}
