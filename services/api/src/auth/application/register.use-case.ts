import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { InstitutionInviteService } from "../../institutions/institution-invite.service";
import { InstitutionDomainService } from "../../institutions/institution-domain.service";
import { ApprovalService } from "../../institutions/approval.service";
import { EmailService } from "../../email/email.service";
import { SubscriptionService } from "../../billing/subscription.service";
import { RegisterDto } from "../dto/auth.dto";

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly inviteService: InstitutionInviteService,
    private readonly domainService: InstitutionDomainService,
    private readonly approvalService: ApprovalService,
    private readonly emailService: EmailService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async execute(registerDto: RegisterDto, inviteToken?: string) {
    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    // 1. Check if registering with an invite
    if (inviteToken) {
      return this.registerWithInvite(registerDto, inviteToken);
    }

    // 2. Check if email domain belongs to an institution
    const domainConfig = await this.domainService.findByEmail(
      registerDto.email,
    );

    if (domainConfig) {
      if (domainConfig.autoApprove) {
        return this.registerWithInstitution(registerDto, domainConfig);
      } else {
        return this.approvalService.createPending(
          domainConfig.institutionId,
          registerDto.email,
          registerDto.name,
          registerDto.password,
          domainConfig.defaultRole,
        );
      }
    }

    // 3. Normal registration
    return this.registerNormalUser(registerDto);
  }

  private async registerWithInvite(registerDto: RegisterDto, token: string) {
    const invite: any = await this.inviteService.findByToken(token);

    if (!invite || !invite.valid) {
      throw new UnauthorizedException(invite?.message || "Invalid or expired invite");
    }

    if (invite.email.toLowerCase() !== registerDto.email.toLowerCase()) {
      throw new UnauthorizedException("Email does not match invite");
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(registerDto.password, 10);
      const newUser = await tx.users.create({
        data: {
          id: uuidv4(),
          name: registerDto.name,
          email: registerDto.email,
          password_hash: passwordHash,
          last_institution_id: String(invite.institutionId),
          schooling_level: "ADULT",
          status: "ACTIVE",
          updated_at: new Date(),
        } as any,
      });

      await tx.institution_members.create({
        data: {
          id: uuidv4(),
          institution_id: String(invite.institutionId),
          user_id: newUser.id,
          role: invite.role as any,
          status: "ACTIVE",
        },
      });

      await this.subscriptionService.createFreeSubscription(newUser.id);

      await tx.institution_invites.update({
        where: { id: invite.id },
        data: { used_at: new Date() },
      });

      return newUser;
    });

    this.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  private async registerWithInstitution(
    registerDto: RegisterDto,
    domainConfig: any,
  ) {
    const user = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(registerDto.password, 10);
      const newUser = await tx.users.create({
        data: {
          id: uuidv4(),
          name: registerDto.name,
          email: registerDto.email,
          password_hash: passwordHash,
          last_institution_id: domainConfig.institutionId,
          schooling_level: "ADULT",
          status: "ACTIVE",
          updated_at: new Date(),
        } as any,
      });

      await tx.institution_members.create({
        data: {
          id: uuidv4(),
          institution_id: domainConfig.institutionId,
          user_id: newUser.id,
          role: domainConfig.defaultRole as any,
          status: "ACTIVE",
        },
      });

      await this.subscriptionService.createFreeSubscription(newUser.id);

      return newUser;
    });

    this.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  private async registerNormalUser(registerDto: RegisterDto) {
    const user = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(registerDto.password, 10);
      const newUser = await tx.users.create({
        data: {
          id: uuidv4(),
          name: registerDto.name,
          email: registerDto.email,
          password_hash: passwordHash,
          last_context_role: "OWNER",
          schooling_level: "ADULT",
          status: "ACTIVE",
          updated_at: new Date(),
        } as any,
      });

      await this.subscriptionService.createFreeSubscription(newUser.id);

      return newUser;
    });

    this.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  private sendWelcomeEmail(email: string, name: string) {
    this.emailService.sendWelcomeEmail({ email, name }).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });
  }
}
