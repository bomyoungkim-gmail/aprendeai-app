import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, users } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UpdateProfileDto, UpdateSettingsDto } from "./dto/user.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { email },
      include: {
        institution_members: {
          include: { institutions: true },
        },
      },
    });
  }

  async findById(id: string): Promise<users | null> {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async getUserContext(userId: string) {
    const user = (await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        last_context_role: true, // Replaces legacy role
        institution_members: {
          select: {
            institution_id: true,
            role: true,
          },
          where: { status: "ACTIVE" },
        },
        family_members: {
          select: {
            family_id: true,
            role: true,
            families: {
              select: {
                family_members: true,
              },
            },
          },
        },
      },
    })) as any;

    if (!user) throw new NotFoundException("User not found");

    return {
      userId: user.id,
      role: user.last_context_role, // Mapping context_role to legacy role response if needed by frontend
      institutionId: user.institution_members[0]?.institution_id,
      institutionRole: user.institution_members[0]?.role,
      familyId: user.family_members[0]?.family_id,
      familyRole: user.family_members[0]?.role,
      contentFilters: {
        minAge: 3,
        maxAge: 18,
      },
      screenTimeLimit: null,
    };
  }

  async createUser(data: Prisma.usersCreateInput): Promise<users> {
    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(data.password_hash, salt);

    return this.prisma.users.create({
      data: {
        id: uuidv4(),
        ...data,
        password_hash,
        updated_at: new Date(),
      },
    });
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<users> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...updateDto,
        updated_at: new Date(),
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<users> {
    return this.prisma.users.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
    });
  }

  async getStats(userId: string) {
    const [contentsCount, annotationsCount, groupsCount] = await Promise.all([
      this.prisma.contents.count({ where: { owner_user_id: userId } }),
      this.prisma.annotations.count({ where: { user_id: userId } }),
      this.prisma.study_group_members.count({ where: { user_id: userId } }),
    ]);

    // Sessions count - count via group memberships
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        study_group_members: {
          include: {
            study_groups: {
              include: {
                group_sessions: true,
              },
            },
          },
        },
      },
    });

    const sessionsCount =
      user?.study_group_members.flatMap((m) => m.study_groups.group_sessions)
        .length || 0;

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
    const recentAnnotations = await this.prisma.annotations.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        contents: {
          select: { title: true },
        },
      },
    });

    // Get recent group joins
    const recentGroups = await this.prisma.study_group_members.findMany({
      where: { user_id: userId },
      orderBy: { joined_at: "desc" },
      take: limit,
      include: {
        study_groups: {
          select: { name: true },
        },
      },
    });

    // Combine and sort by date
    const activities = [
      ...recentAnnotations.map((a) => ({
        type: "annotation" as const,
        description: `Annotated "${a.contents.title}"`,
        timestamp: a.created_at,
      })),
      ...recentGroups.map((g) => ({
        type: "group_join" as const,
        description: `Joined "${g.study_groups.name}"`,
        timestamp: g.joined_at,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return activities;
  }

  async getSettings(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Settings are stored as JSON in user.settings field
    return (
      user.settings || {
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
      }
    );
  }

  async updateSettings(userId: string, settingsDto: UpdateSettingsDto) {
    const currentSettings = (await this.getSettings(userId)) as any;

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

    return this.prisma.users.update({
      where: { id: userId },
      data: { settings: updatedSettings },
      // updated_at will be auto-updated if @updatedAt or handled by DB,
      // but if I need to manual update:
      // updated_at: new Date()
      // Schema likely has it. I'll add it to be safe as I've been doing.
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date(),
      },
    });

    return { message: "Password changed successfully" };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Password is incorrect");
    }

    // Delete user (cascade will handle related records)
    await this.prisma.users.delete({
      where: { id: userId },
    });

    return { message: "Account deleted successfully" };
  }
}
