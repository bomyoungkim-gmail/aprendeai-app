import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { FamilyRole, FamilyMemberStatus, ScopeType } from '@prisma/client';
import { SubscriptionService } from '../billing/subscription.service';
import { UsageTrackingService } from '../billing/usage-tracking.service';

@Injectable()
export class FamilyService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
    private usageTracking: UsageTrackingService,
  ) {}

  /**
   * Create a new family
   */
  async create(userId: string, dto: CreateFamilyDto) {
    // Transaction to create family and add owner as member
    return this.prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          name: dto.name,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'OWNER',
              status: 'ACTIVE',
            },
          },
        },
        include: {
          members: true,
        },
      });

      // Create initial Subscription for the family (Free Tier)
      await this.subscriptionService.createInitialSubscription(ScopeType.FAMILY, family.id, tx);

      return family;
    });
  }

  /**
   * Find families for a user
   */
  async findAllForUser(userId: string) {
    return this.prisma.family.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find one family by ID (with validation)
   */
  async findOne(familyId: string, userId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
           select: { id: true, name: true, email: true }
        }
        // subscriptions is not a direct relation anymore, need billing service to fetch
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Check membership
    const isMember = family.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this family');
    }

    return family;
  }

  /**
   * Invite a member by email
   */
  async inviteMember(familyId: string, userId: string, dto: InviteMemberDto) {
    // 1. Verify permission (Only Owner or Guardian)
    const family = await this.findOne(familyId, userId);
    const requester = family.members.find(m => m.userId === userId);

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'GUARDIAN')) {
      throw new ForbiddenException('Only Owners and Guardians can invite members');
    }

    // 2. Find user by email
    let invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!invitedUser) {
       // Allow inviting non-existing users
       // In a real scenario, we would send an email with a sign-up link.
       // For MVP, if user doesn't exist, we create a placeholder or throw a strictly typed error 
       // that the frontend can handle to show "Invitation sent to new user".
       // OR, more dangerously but easier for MVP: Create the user account with a temporary password/flag.
       
       // DECISION: For this MVP, we will return a specific message/object indicating the user needs to sign up.
       // But wait, the FamilyMember relation *requires* a userId.
       // So we MUST create a User record.
       
       console.log(`Inviting new user: ${dto.email}`);
       invitedUser = await this.prisma.user.create({
         data: {
            email: dto.email,
            name: dto.displayName || dto.email.split('@')[0],
            passwordHash: 'PENDING_INVITE', // Disabled login until reset/claim
            role: 'COMMON_USER',
            schoolingLevel: 'UNDERGRADUATE',
         }
       });
    }

    // 3. Check if already member
    const existingMember = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this family');
    }

    // 4. Create member (INVITED)
    const newMember = await this.prisma.familyMember.create({
      data: {
        familyId,
        userId: invitedUser.id,
        role: dto.role,
        status: 'INVITED',
        displayName: dto.displayName,
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } }
      }
    });

    return newMember;
  }

  /**
   * Remove member
   */
  async removeMember(familyId: string, userId: string, memberUserIdToRemove: string) {
    const family = await this.findOne(familyId, userId);
    const requester = family.members.find(m => m.userId === userId);

    // Only user themselves or Owner can remove
    if (userId !== memberUserIdToRemove && requester?.role !== 'OWNER') {
      throw new ForbiddenException('Insufficient permissions to remove member');
    }

    if (family.ownerId === memberUserIdToRemove) {
      throw new BadRequestException('Cannot remove the Family Owner');
    }

    return this.prisma.familyMember.delete({
      where: {
        familyId_userId: {
          familyId,
          userId: memberUserIdToRemove,
        },
      },
    });
  }

  /**
   * Accept invite
   */
  async acceptInvite(familyId: string, userId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Invite not found');
    }

    if (member.status === 'ACTIVE') {
        return member;
    }

    return this.prisma.familyMember.update({
      where: { id: member.id },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Get family analytics/usage
   */
  async getAnalytics(familyId: string, userId: string) {
    // 1. Check membership
    await this.findOne(familyId, userId);

    // 2. Get usage stats for the family scope
    const usage = await this.usageTracking.getUsageStats(
      ScopeType.FAMILY,
      familyId,
      '30d'
    );

    return usage;
  }

  /**
   * Resolve billing hierarchy for a user
   * Returns [UserScope, FamilyScope?]
   */
  async resolveBillingHierarchy(userId: string): Promise<{ scopeType: ScopeType; scopeId: string }[]> {
    const hierarchy: { scopeType: ScopeType; scopeId: string }[] = [{ scopeType: ScopeType.USER, scopeId: userId }];

    // Fetch user settings to see if a primary family is set
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    const settings = user?.settings as Record<string, any>;
    const primaryFamilyId = settings?.primaryFamilyId;

    let member;

    if (primaryFamilyId) {
      // Check if member of primary family
      member = await this.prisma.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: primaryFamilyId,
            userId,
          },
        },
      });
      // Ensure it's active
      if (member && member.status !== 'ACTIVE') {
        member = null;
      }
    }

    // Fallback if no primary, or primary is invalid/inactive: find first active
    if (!member) {
      member = await this.prisma.familyMember.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { familyId: true, id: true, status: true },
      });
    }

    if (member) {
      hierarchy.push({ scopeType: ScopeType.FAMILY, scopeId: member.familyId });
    }

    return hierarchy;
  }

  /**
   * Set primary family
   */
  async setPrimaryFamily(userId: string, familyId: string) {
    // Verify membership
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: { familyId, userId },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be an active member of the family to set it as primary');
    }

    // Update user settings
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentSettings = (user?.settings as Record<string, any>) || {};

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...currentSettings,
          primaryFamilyId: familyId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Transfer family ownership
   */
  async transferOwnership(familyId: string, currentOwnerId: string, newOwnerId: string) {
    const family = await this.findOne(familyId, currentOwnerId);

    // Verify current owner
    if (family.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only the current owner can transfer ownership');
    }

    // Verify new owner is a member
    const newOwnerMember = family.members.find(m => m.userId === newOwnerId);
    if (!newOwnerMember) {
      throw new BadRequestException('New owner must be a member of the family');
    }

    // Transaction to update ownerId and roles
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Family ownerId
      await tx.family.update({
        where: { id: familyId },
        data: { ownerId: newOwnerId },
      });

      // 2. Update Old Owner Role to ADMIN (or MEMBER)
      await tx.familyMember.update({
        where: {
          familyId_userId: { familyId, userId: currentOwnerId },
        },
        data: { role: 'ADMIN' as any },
      });

      // 3. Update New Owner Role to OWNER
      await tx.familyMember.update({
        where: {
          familyId_userId: { familyId, userId: newOwnerId },
        },
        data: { role: 'OWNER' },
      });

      return { success: true };
    });
  }

  /**
   * Delete family
   */
  async deleteFamily(familyId: string, userId: string) {
    const family = await this.findOne(familyId, userId);

    if (family.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete the family');
    }

    // Delete family (Cascades to members due to relation, but let's be safe/check logic)
    // Prisma relation usually cascades delete.
    return this.prisma.family.delete({
      where: { id: familyId },
    });
  }
}
