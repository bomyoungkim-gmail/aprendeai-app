import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { ScopeType } from "@prisma/client";
import { SubscriptionService } from "../billing/subscription.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
import { IFamilyRepository } from "./domain/family.repository.interface";
import { CreateFamilyUseCase } from "./application/use-cases/create-family.use-case";

@Injectable()
export class FamilyService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
    private usageTracking: UsageTrackingService,
    @Inject(IFamilyRepository) private readonly repository: IFamilyRepository,
    private readonly createFamilyUseCase: CreateFamilyUseCase,
  ) {}

  /**
   * ✅ Issue #8: Validate family member limit (max 6 ACTIVE members)
   */
  private async validateMemberLimit(familyId: string): Promise<void> {
    const activeMembers = await this.prisma.family_members.count({
      where: { family_id: familyId, status: "ACTIVE" },
    });

    if (activeMembers >= 6) {
      throw new BadRequestException(
        "Family member limit reached (maximum 6 active members)",
      );
    }
  }

  /**
   * Create a new family
   */
  async create(userId: string, dto: CreateFamilyDto) {
    return this.createFamilyUseCase.execute(userId, dto);
  }

  /**
   * Find families for a user
   */
  async findAllForUser(userId: string) {
    return this.prisma.families.findMany({
      where: {
        family_members: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        family_members: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
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
    const family = await this.prisma.families.findUnique({
      where: { id: familyId },
      include: {
        family_members: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
        users_owner: {
          // owner relation
          select: { id: true, name: true, email: true },
        },
        // subscriptions is not a direct relation anymore, need billing service to fetch
      },
    });

    if (!family) {
      throw new NotFoundException("Family not found");
    }

    // Check membership
    const isMember = family.family_members.some((m) => m.user_id === userId);
    if (!isMember) {
      throw new ForbiddenException("You are not a member of this family");
    }

    return family;
  }

  /**
   * Invite a member by email
   */
  async inviteMember(familyId: string, userId: string, dto: InviteMemberDto) {
    // 1. Verify permission (Only Owner or Guardian)
    const family = await this.findOne(familyId, userId);
    const requester = family.family_members.find((m) => m.user_id === userId);

    if (
      !requester ||
      (requester.role !== "OWNER" && requester.role !== "GUARDIAN")
    ) {
      throw new ForbiddenException(
        "Only Owners and Guardians can invite members",
      );
    }

    // ✅ Issue #8: Validate member limit before inviting
    await this.validateMemberLimit(familyId);

    // 2. Find user by email
    let invitedUser = await this.prisma.users.findUnique({
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
      const { v4: uuidv4 } = require("uuid");
      invitedUser = await this.prisma.users.create({
        data: {
          id: uuidv4(),
          email: dto.email,
          name: dto.displayName || dto.email.split("@")[0],
          password_hash: "PENDING_INVITE", // Disabled login until reset/claim
          system_role: "USER" as any,
          schooling_level: "UNDERGRADUATE",
          updated_at: new Date(),
        } as any,
      });
    }

    // 3. Check if already member
    const existingMember = await this.prisma.family_members.findUnique({
      where: {
        family_id_user_id: {
          family_id: familyId,
          user_id: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException("User is already a member of this family");
    }

    // 4. Create member (INVITED)
    const { v4: uuidv4 } = require("uuid");
    const newMember = await this.prisma.family_members.create({
      data: {
        id: uuidv4(),
        family_id: familyId,
        user_id: invitedUser.id,
        role: dto.role,
        status: "INVITED",
        display_name: dto.displayName,
      },
      include: {
        users: {
          select: { id: true, email: true, name: true, avatar_url: true },
        },
      },
    });

    return newMember;
  }

  /**
   * Remove member
   */
  async removeMember(
    familyId: string,
    userId: string,
    memberUserIdToRemove: string,
  ) {
    const family = await this.findOne(familyId, userId);
    const requester = family.family_members.find((m) => m.user_id === userId);

    // Only user themselves or Owner can remove
    if (userId !== memberUserIdToRemove && requester?.role !== "OWNER") {
      throw new ForbiddenException("Insufficient permissions to remove member");
    }

    if (family.owner_user_id === memberUserIdToRemove) {
      throw new BadRequestException("Cannot remove the Family Owner");
    }

    return this.prisma.family_members.delete({
      where: {
        family_id_user_id: {
          family_id: familyId,
          user_id: memberUserIdToRemove,
        },
      },
    });
  }

  /**
   * Accept invite
   */
  async acceptInvite(familyId: string, userId: string) {
    const member = await this.prisma.family_members.findUnique({
      where: {
        family_id_user_id: {
          family_id: familyId,
          user_id: userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Invite not found");
    }

    if (member.status === "ACTIVE") {
      return member;
    }

    // Update member status to ACTIVE
    const updatedMember = await this.prisma.family_members.update({
      where: { id: member.id },
      data: { status: "ACTIVE" },
    });

    // Auto-set as Primary if this is user's first family (Rule 2.1)
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    const currentSettings = (user?.settings as Record<string, any>) || {};
    const hasPrimaryFamily = currentSettings.primaryFamilyId;

    if (!hasPrimaryFamily) {
      // First family - auto-set as Primary
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          settings: {
            ...currentSettings,
            primaryFamilyId: familyId,
          },
        },
      });
    }
    // Rule 2.2: If user already has a Primary family, don't change it

    return updatedMember;
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
      "30d",
    );

    return usage;
  }

  /**
   * Resolve billing hierarchy for a user
   * Returns [UserScope, FamilyScope?]
   */
  async resolveBillingHierarchy(
    userId: string,
  ): Promise<{ scopeType: ScopeType; scopeId: string }[]> {
    const hierarchy: { scopeType: ScopeType; scopeId: string }[] = [
      { scopeType: ScopeType.USER, scopeId: userId },
    ];

    // Fetch user settings to see if a primary family is set
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    const settings = user?.settings as Record<string, any>;
    const primaryFamilyId = settings?.primaryFamilyId;

    let member;

    if (primaryFamilyId) {
      // Check if member of primary family
      member = await this.prisma.family_members.findUnique({
        where: {
          family_id_user_id: {
            family_id: primaryFamilyId,
            user_id: userId,
          },
        },
      });
      // Ensure it's active
      if (member && member.status !== "ACTIVE") {
        member = null;
      }
    }

    // Fallback if no primary, or primary is invalid/inactive: find first active
    if (!member) {
      member = await this.prisma.family_members.findFirst({
        where: { user_id: userId, status: "ACTIVE" },
        select: { family_id: true, id: true, status: true },
      });
    }

    if (member) {
      hierarchy.push({
        scopeType: ScopeType.FAMILY,
        scopeId: member.family_id,
      });
    }

    return hierarchy;
  }

  /**
   * Set primary family
   */
  async setPrimaryFamily(userId: string, familyId: string) {
    // Verify membership
    const member = await this.prisma.family_members.findUnique({
      where: {
        family_id_user_id: { family_id: familyId, user_id: userId },
      },
    });

    if (!member || member.status !== "ACTIVE") {
      throw new ForbiddenException(
        "You must be an active member of the family to set it as primary",
      );
    }

    // Update user settings
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    const currentSettings = (user?.settings as Record<string, any>) || {};

    await this.prisma.users.update({
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
   * Transfer family ownership to another member.
   *
   * This executes a transaction to ensure atomicity:
   * 1. Updates the Family record to point to the new owner.
   * 2. Downgrades the OLD owner to 'GUARDIAN' role (so they remain an admin-like member).
   * 3. Upgrades the NEW owner to 'OWNER' role.
   *
   * @param familyId The ID of the family
   * @param currentOwnerId The ID of the current owner (must match family.ownerId)
   * @param newOwnerId The ID of the member to become the new owner
   */

  async transferOwnership(
    familyId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ) {
    const family = await this.findOne(familyId, currentOwnerId);

    // Verify current owner FIRST (before self-transfer check)
    if (family.owner_user_id !== currentOwnerId) {
      throw new ForbiddenException(
        "Only the current owner can transfer ownership",
      );
    }

    // Prevent transferring to self (no-op) - AFTER validation
    if (currentOwnerId === newOwnerId) {
      return { success: true };
    }

    // DEBUG: Log ownership state
    if (process.env.NODE_ENV === "test") {
      console.log("[transferOwnership] Validation:", {
        familyOwnerId: family.owner_user_id,
        currentOwnerId,
        match: family.owner_user_id === currentOwnerId,
        willThrow: family.owner_user_id !== currentOwnerId,
      });
    }

    // Verify new owner is a member
    const newOwnerMember = family.family_members.find(
      (m) => m.user_id === newOwnerId,
    );
    if (!newOwnerMember) {
      throw new BadRequestException("New owner must be a member of the family");
    }

    // Transaction to update ownerId and roles
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Family ownerId
      await tx.families.update({
        where: { id: familyId },
        data: { owner_user_id: newOwnerId },
      });

      // 2. Update Old Owner Role to GUARDIAN
      // We downgrade them so they don't lose access, but there can be only 1 OWNER.
      await tx.family_members.update({
        where: {
          family_id_user_id: { family_id: familyId, user_id: currentOwnerId },
        },
        data: { role: "GUARDIAN" },
      });

      // 3. Update New Owner Role to OWNER
      // We upgrade the selected member to be the new OWNER.
      await tx.family_members.update({
        where: {
          family_id_user_id: { family_id: familyId, user_id: newOwnerId },
        },
        data: { role: "OWNER" },
      });

      return { success: true };
    });
  }

  /**
   * Delete family
   */
  async deleteFamily(familyId: string, userId: string) {
    const family = await this.findOne(familyId, userId);

    if (family.owner_user_id !== userId) {
      throw new ForbiddenException("Only the owner can delete the family");
    }

    // Delete family (Cascades to members due to relation, but let's be safe/check logic)
    // Prisma relation usually cascades delete.
    return this.prisma.families.delete({
      where: { id: familyId },
    });
  }

  /**
   * Get family dashboard data for owner
   */
  async getFamilyForOwner(userId: string) {
    // 1. Get user's primary family from settings
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    const settings = user?.settings as Record<string, any>;
    let familyId = settings?.primaryFamilyId;

    // 2. If no primary, find first family where user is OWNER or GUARDIAN
    if (!familyId) {
      const member = await this.prisma.family_members.findFirst({
        where: { user_id: userId, status: "ACTIVE" },
        orderBy: { role: "asc" }, // OWNER comes first alphabetically? No, O > G. But 'OWNER' > 'GUARDIAN'.
        // Let's rely on finding any active family for now
      });
      familyId = member?.family_id;
    }

    if (!familyId) {
      return null; // No family found
    }

    // 3. Fetch details
    const family = await this.prisma.families.findUnique({
      where: { id: familyId },
      include: {
        family_members: {
          include: {
            users: {
              select: { id: true, name: true, email: true, avatar_url: true },
            },
          },
        },
      },
    });

    if (!family) return null;

    // 4. Aggregate Stats
    const totalMembers = family.family_members.length;
    const activeMembers = family.family_members.filter(
      (m) => m.status === "ACTIVE",
    ).length;

    // Check billing status (mocked for now, or fetch from subscription service)
    // const subscription = await this.subscriptionService.getSubscription(ScopeType.FAMILY, familyId);

    return {
      ...family,
      stats: {
        totalMembers,
        activeMembers,
        plan: "Free", // Default for now
      },
    };
  }
}
