import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    let profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.learnerProfile.create({
        data: {
          userId,
          educationLevel: 'ADULTO_LEIGO',
          dailyTimeBudgetMin: 30,
        },
      });
    }

    return profile;
  }

  async get(userId: string) {
    return this.prisma.learnerProfile.findUnique({
      where: { userId },
    });
  }

  async update(userId: string, data: UpdateProfileDto) {
    return this.prisma.learnerProfile.update({
      where: { userId },
      data: {
        ...data,
        ...(data.educationLevel && { educationLevel: data.educationLevel as any }),
      },
    });
  }
}
