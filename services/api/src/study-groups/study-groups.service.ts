import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { GroupRole, StudyGroup, StudyGroupMember } from '@prisma/client';

@Injectable()
export class StudyGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(userId: string, dto: CreateGroupDto): Promise<StudyGroup> {
    // Create group and add creator as OWNER
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.studyGroup.create({
        data: {
          ownerUserId: userId,
          name: dto.name,
          scopeType: dto.scopeType,
          scopeId: dto.scopeId,
        },
      });

      // Add creator as OWNER and ACTIVE member
      await tx.studyGroupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      return group;
    });
  }

  async getGroupsByUser(userId: string): Promise<StudyGroup[]> {
    const memberships = await this.prisma.studyGroupMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                contents: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => m.group);
  }

  async getGroup(groupId: string, userId: string) {
    // Verify user is member
    await this.assertMembership(groupId, userId);

    return this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        contents: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });
  }

  async inviteMember(groupId: string, inviterId: string, dto: InviteMemberDto): Promise<void> {
    // Verify inviter has permission (OWNER or MOD)
    await this.assertPermission(groupId, inviterId, ['OWNER', 'MOD']);

    // Check if user already member
    const existing = await this.prisma.studyGroupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: dto.userId },
      },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new BadRequestException('User is already an active member');
      }
      // Reactivate removed member
      await this.prisma.studyGroupMember.update({
        where: { groupId_userId: { groupId, userId: dto.userId } },
        data: { status: 'INVITED', role: dto.role },
      });
      return;
    }

    await this.prisma.studyGroupMember.create({
      data: {
        groupId,
        userId: dto.userId,
        role: dto.role,
        status: 'INVITED',
      },
    });
  }

  async removeMember(groupId: string, removerId: string, targetUserId: string): Promise<void> {
    // Verify remover has permission
    await this.assertPermission(groupId, removerId, ['OWNER', 'MOD']);

    // Cannot remove owner
    const target = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (target?.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove group owner');
    }

    await this.prisma.studyGroupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { status: 'REMOVED' },
    });
  }

  async addContent(groupId: string, userId: string, contentId: string): Promise<void> {
    // Verify user is active member
    await this.assertMembership(groupId, userId);

    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if already added
    const existing = await this.prisma.groupContent.findUnique({
      where: { groupId_contentId: { groupId, contentId } },
    });

    if (existing) {
      throw new BadRequestException('Content already in playlist');
    }

    await this.prisma.groupContent.create({
      data: {
        groupId,
        contentId,
        addedByUserId: userId,
      },
    });
  }

  async removeContent(groupId: string, userId: string, contentId: string): Promise<void> {
    // Only OWNER/MOD can remove
    await this.assertPermission(groupId, userId, ['OWNER', 'MOD']);

    await this.prisma.groupContent.delete({
      where: { groupId_contentId: { groupId, contentId } },
    });
  }

  // Helper: Assert user is active member
  async assertMembership(groupId: string, userId: string): Promise<StudyGroupMember> {
    const member = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('Access denied: not an active member');
    }

    return member;
  }

  // Helper: Assert user has required role
  async assertPermission(groupId: string, userId: string, allowedRoles: GroupRole[]): Promise<void> {
    const member = await this.assertMembership(groupId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException(`Access denied: requires role ${allowedRoles.join(' or ')}`);
    }
  }

  // Helper: Get active members
  async getActiveMembers(groupId: string): Promise<StudyGroupMember[]> {
    return this.prisma.studyGroupMember.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
