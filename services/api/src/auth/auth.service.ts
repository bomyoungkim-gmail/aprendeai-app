import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionService } from '../billing/subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private subscriptionService: SubscriptionService,
    private prisma: PrismaService,
    private emailService: EmailService,
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

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

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
}
