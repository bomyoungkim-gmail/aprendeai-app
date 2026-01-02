import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { Transactional, TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
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
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
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
      throw new UnauthorizedException(
        invite?.message || "Invalid or expired invite",
      );
    }

    if (invite.email.toLowerCase() !== registerDto.email.toLowerCase()) {
      throw new UnauthorizedException("Email does not match invite");
    }

    const user = await this.registerWithInviteTransaction(registerDto, invite);

    this.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  @Transactional()
  private async registerWithInviteTransaction(
    registerDto: RegisterDto,
    invite: any,
  ) {
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersRepository.create({
      id: uuidv4(),
      name: registerDto.name,
      email: registerDto.email,
      password_hash: passwordHash,
      last_institution_id: invite.institutionId,
      schooling_level: "ADULT",
      status: "ACTIVE",
      updated_at: new Date(),
    } as any);

    await this.txHost.tx.institution_members.create({
      data: {
        id: uuidv4(),
        institution_id: invite.institutionId,
        user_id: newUser.id,
        role: invite.role as any,
        status: "ACTIVE",
      },
    });

    await this.subscriptionService.createFreeSubscription(newUser.id);

    await (this.txHost.tx as PrismaService).institution_invites.update({
      // Cast needed? txHost.tx is usually typed if generic provided.
      // Actually generic is TransactionalAdapterPrisma. But tx property needs to be cast or we trust it.
      // Let's use a helper getter or just cast.
      where: { id: invite.id },
      data: { used_at: new Date() },
    });

    return newUser;
  }

  private async registerWithInstitution(
    registerDto: RegisterDto,
    domainConfig: any,
  ) {
    const user = await this.registerWithInstitutionTransaction(
      registerDto,
      domainConfig,
    );
    this.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  @Transactional()
  private async registerWithInstitutionTransaction(
    registerDto: RegisterDto,
    domainConfig: any,
  ) {
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersRepository.create({
      id: uuidv4(),
      name: registerDto.name,
      email: registerDto.email,
      password_hash: passwordHash,
      last_institution_id: domainConfig.institutionId,
      schooling_level: "ADULT",
      status: "ACTIVE",
      updated_at: new Date(),
    } as any);

    await this.txHost.tx.institution_members.create({
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
  }

  private async registerNormalUser(registerDto: RegisterDto) {
    const user = await this.registerNormalUserTransaction(registerDto);
    this.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  @Transactional()
  private async registerNormalUserTransaction(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersRepository.create({
      id: uuidv4(),
      name: registerDto.name,
      email: registerDto.email,
      password_hash: passwordHash,
      last_context_role: "OWNER",
      schooling_level: "ADULT",
      status: "ACTIVE",
      updated_at: new Date(),
    } as any);

    await this.subscriptionService.createFreeSubscription(newUser.id);

    return newUser;
  }

  private sendWelcomeEmail(email: string, name: string) {
    this.emailService.sendWelcomeEmail({ email, name }).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });
  }
}
