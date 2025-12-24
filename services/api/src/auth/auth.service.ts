import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionService } from '../billing/subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { URL_CONFIG } from '../config/urls.config';
import { UserRole } from '@prisma/client';
import { InstitutionInviteService } from '../institutions/institution-invite.service';
import { InstitutionDomainService } from '../institutions/institution-domain.service';
import { ApprovalService } from '../institutions/approval.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private subscriptionService: SubscriptionService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private inviteService: InstitutionInviteService,
    private domainService: InstitutionDomainService,
    private approvalService: ApprovalService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Validate user has subscription (self-heal if missing)
    const hasSubscription = await this.subscriptionService.hasActiveSubscription('USER', user.id);
    if (!hasSubscription) {
      // Auto-heal: create FREE subscription
      await this.subscriptionService.createFreeSubscription(user.id);
    }
    
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async register(registerDto: RegisterDto, inviteToken?: string) {
    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // INSTITUTIONAL REGISTRATION FLOW
    
    // 1. Check if registering with an invite
    if (inviteToken) {
      return this.registerWithInvite(registerDto, inviteToken);
    }
    
    // 2. Check if email domain belongs to an institution
    const domainConfig = await this.domainService.findByEmail(registerDto.email);
    
    if (domainConfig) {
      // Email belongs to institutional domain
      if (domainConfig.autoApprove) {
        // Auto-approve: create user immediately
        return this.registerWithInstitution(registerDto, domainConfig);
      } else {
        // Manual approval required: create pending approval
        return this.approvalService.createPending(
          domainConfig.institutionId,
          registerDto.email,
          registerDto.name,
          registerDto.password,
          domainConfig.defaultRole,
        );
      }
    }
    
    // 3. Normal registration (no institution)
    return this.registerNormalUser(registerDto);
  }

  /**
   * Register user with an invite token
   */
  private async registerWithInvite(registerDto: RegisterDto, token: string) {
    const invite = await this.inviteService.findByToken(token);
    
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invite');
    }
    
    // Verify email matches
    if (invite.email.toLowerCase() !== registerDto.email.toLowerCase()) {
      throw new UnauthorizedException('Email does not match invite');
    }
    
    // Create user with institution in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: await bcrypt.hash(registerDto.password, 10),
          role: invite.role, // Use role from invite
          institutionId: invite.institutionId,
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
        },
      });
      
      // Create institution member
      await tx.institutionMember.create({
        data: {
          institutionId: invite.institutionId,
          userId: newUser.id,
          role: invite.role,
          status: 'ACTIVE',
        },
      });
      
      // Create FREE subscription
      await this.subscriptionService.createFreeSubscription(newUser.id, tx);
      
      // Mark invite as used
      await tx.institutionInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      
      const { passwordHash, ...result } = newUser;
      return result;
    });
    
    // Send welcome email
    this.emailService.sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
    });
    
    return user;
  }

  /**
   * Register user with institutional domain (auto-approve)
   */
  private async registerWithInstitution(registerDto: RegisterDto, domainConfig: any) {
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: await bcrypt.hash(registerDto.password, 10),
          role: domainConfig.defaultRole,
          institutionId: domainConfig.institutionId,
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
        },
      });
      
      // Create institution member
      await tx.institutionMember.create({
        data: {
          institutionId: domainConfig.institutionId,
          userId: newUser.id,
          role: domainConfig.defaultRole,
          status: 'ACTIVE',
        },
      });
      
      // Create FREE subscription
      await this.subscriptionService.createFreeSubscription(newUser.id, tx);
      
      const { passwordHash, ...result } = newUser;
      return result;
    });
    
    // Send welcome email
    this.emailService.sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
    });
    
    return user;
  }

  /**
   * Normal user registration (no institution)
   */
  private async registerNormalUser(registerDto: RegisterDto) {
    // Create user + FREE subscription in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: await bcrypt.hash(registerDto.password, 10),
          role: registerDto.role || UserRole.COMMON_USER,
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
        },
      });

      // Create FREE subscription automatically
      await this.subscriptionService.createFreeSubscription(newUser.id, tx);

      const { passwordHash, ...result } = newUser;
      return result;
    });

    // Send welcome email (async, don't wait)
    this.emailService.sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    return user;
  }

  /**
   * Validate OAuth user - create new or link to existing account
   */
  async validateOAuthUser(oauthData: {
    oauthId: string;
    oauthProvider: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
    // Check if user exists with this OAuth ID
    let user = await this.prisma.user.findFirst({
      where: {
        oauthProvider: oauthData.oauthProvider,
        oauthId: oauthData.oauthId,
      },
    });

    if (user) {
      // Update picture if changed
      if (oauthData.picture && user.oauthPicture !== oauthData.picture) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { oauthPicture: oauthData.picture },
        });
      }
      return user;
    }

    // Check if user exists with this email
    user = await this.prisma.user.findUnique({
      where: { email: oauthData.email },
    });

    if (user) {
      // Link OAuth to existing account
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: oauthData.oauthProvider,
          oauthId: oauthData.oauthId,
          oauthPicture: oauthData.picture,
        },
      });
    }

    // Create new user with OAuth
    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: oauthData.email,
          name: oauthData.name || oauthData.email.split('@')[0],
          oauthProvider: oauthData.oauthProvider,
          oauthId: oauthData.oauthId,
          oauthPicture: oauthData.picture,
          role: UserRole.COMMON_USER,
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
          passwordHash: null, // No password for OAuth users
        },
      });

      // Create FREE subscription automatically
      await this.subscriptionService.createFreeSubscription(newUser.id, tx);

      return newUser;
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Return true to prevent enumeration attacks
      return true;
    }

    // Generate random 32-byte hex token
    const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    const resetLink = `${URL_CONFIG.frontend.base}/reset-password?token=${token}`;

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Redefinição de Senha - AprendeAI 🔒',
        template: 'password-reset', // We need to ensure this template exists or create a simple fallback
        context: {
          name: user.name,
          resetUrl: resetLink,
        },
      });
    } catch (e) {
      console.error('Failed to send reset email:', e);
    }

    return true;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password updated successfully' };
  }
}
