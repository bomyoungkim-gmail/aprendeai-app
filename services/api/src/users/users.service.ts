import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        institutionMembers: {
          select: {
            institutionId: true,
            role: true,
          },
          where: { status: 'ACTIVE' },
        },
        familyMembers: {
          select: {
            familyId: true,
            role: true,
            family: {
              select: {
                settings: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const familySettings = user.familyMembers[0]?.family?.settings as any;

    return {
      userId: user.id,
      role: user.role,
      institutionId: user.institutionMembers[0]?.institutionId,
      institutionRole: user.institutionMembers[0]?.role,
      familyId: user.familyMembers[0]?.familyId,
      familyRole: user.familyMembers[0]?.role,
      contentFilters: familySettings?.contentFilters || { minAge: 3, maxAge: 18 },
      screenTimeLimit: familySettings?.screenTimeLimit,
    };
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);
    
    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
    });
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateDto,
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  async getStats(userId: string) {
    const [contentsCount, annotationsCount, groupsCount] = await Promise.all([
      this.prisma.content.count({ where: { ownerUserId: userId } }),
      this.prisma.annotation.count({ where: { userId } }),
      this.prisma.studyGroupMember.count({ where: { userId } }),
    ]);

    // Sessions count - count via group memberships
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                sessions: true
              }
            }
          }
        }
      }
    });
    
    const sessionsCount = user?.groupMemberships
      .flatMap(m => m.group.sessions).length || 0;

    return {
      contentsRead: contentsCount,
      annotationsCreated: annotationsCount,
      groupsJoined: groupsCount,
      sessionsAttended: sessionsCount,
      studyHours: 0, // TODO: Calculate from session durations
    };
  }

  async getActivity(userId: string, limit = 10) {
    // Get recent annotations
    const recentAnnotations = await this.prisma.annotation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        content: {
          select: { title: true }
        }
      }
    });

    // Get recent group joins
    const recentGroups = await this.prisma.studyGroupMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      take: limit,
      include: {
        group: {
          select: { name: true }
        }
      }
    });

    // Combine and sort by date
    const activities = [
      ...recentAnnotations.map(a => ({
        type: 'annotation' as const,
        description: `Annotated "${a.content.title}"`,
        timestamp: a.createdAt,
      })),
      ...recentGroups.map(g => ({
        type: 'group_join' as const,
        description: `Joined "${g.group.name}"`,
        timestamp: g.joinedAt,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
     .slice(0, limit);

    return activities;
  }

  async getSettings(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Settings are stored as JSON in user.settings field
    return user.settings || {
      notifications: {
        email: true,
        groupInvites: true,
        annotations: true,
        sessionReminders: true,
        weeklyDigest: false,
      },
      privacy: {
        profileVisible: true,
        showStats: true,
        allowEmailDiscovery: true,
      },
    };
  }

  async updateSettings(userId: string, settingsDto: UpdateSettingsDto) {
    const currentSettings = await this.getSettings(userId) as any;
    
    const updatedSettings = {
      ...currentSettings,
      notifications: {
        ...currentSettings.notifications,
        ...settingsDto.notifications,
      },
      privacy: {
        ...currentSettings.privacy,
        ...settingsDto.privacy,
      },
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: { settings: updatedSettings },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Delete user (cascade will handle related records)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }
}
