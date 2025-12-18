import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionService } from '../billing/subscription.service';
import { PrismaService } from '../prisma/prisma.service';
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
    return this.prisma.$transaction(async (tx) => {
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
  }
}
