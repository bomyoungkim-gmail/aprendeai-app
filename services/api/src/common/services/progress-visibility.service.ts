import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Progress Visibility Service
 *
 * Implements hierarchical access control for viewing student progress.
 * Enforces the following rules:
 * - Students can always view their own progress
 * - Parents/Guardians can view their children's progress
 * - Educators can view their students' progress within their institution
 * - Siblings/Peers cannot view each other's detailed progress
 */
@Injectable()
export class ProgressVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a viewer has permission to view a target user's progress
   *
   * @param viewerId - ID of the user attempting to view progress
   * @param targetUserId - ID of the user whose progress is being viewed
   * @param viewerInstitutionId - Institution ID of the viewer (optional)
   * @param viewerRoles - Roles of the viewer
   * @returns true if viewer can access target's progress, false otherwise
   */
  async canViewProgress(
    viewerId: string,
    targetUserId: string,
    viewerInstitutionId?: string,
    viewerRoles: string[] = [],
  ): Promise<boolean> {
    // 1. Self-access: users can always view their own progress
    if (viewerId === targetUserId) {
      return true;
    }

    // 2. System Admin: full access
    if (viewerRoles.includes('ADMIN')) {
      return true;
    }

    // 3. Family Hierarchy: Check if viewer is a guardian/parent
    const isGuardian = await this.isGuardian(viewerId, targetUserId);
    if (isGuardian) {
      return true;
    }

    // 4. Institution Hierarchy: Check if viewer is an educator with access
    const EDUCATOR_ROLES = ['TEACHER', 'INSTITUTION_EDUCATION_ADMIN', 'EDUCATOR'];
    if (viewerInstitutionId && viewerRoles.some((role) => EDUCATOR_ROLES.includes(role))) {
      const hasStudentAccess = await this.hasStudentInInstitution(
        viewerInstitutionId,
        targetUserId,
      );
      if (hasStudentAccess) {
        return true;
      }
    }

    // 5. Default: deny access
    return false;
  }

  /**
   * Check if viewer is a guardian/parent of the target user
   */
  private async isGuardian(
    viewerId: string,
    targetUserId: string,
  ): Promise<boolean> {
    // Check if viewer is a family admin/owner or listed as guardian
    const familyRelation = await this.prisma.family_members.findFirst({
      where: {
        user_id: targetUserId,
        families: {
          OR: [
            { owner_user_id: viewerId },
            {
              family_members: {
                some: {
                  user_id: viewerId,
                  role: {
                    in: ['OWNER', 'GUARDIAN'],
                  },
                },
              },
            },
          ],
        },
      },
    });

    return !!familyRelation;
  }

  /**
   * Check if a student belongs to an institution
   */
  private async hasStudentInInstitution(
    institutionId: string,
    studentUserId: string,
  ): Promise<boolean> {
    // Check if student is a member of the institution
    const membership = await this.prisma.institution_members.findFirst({
      where: {
        institution_id: institutionId,
        user_id: studentUserId,
        status: 'ACTIVE',
      },
    });

    // Also check if student is enrolled in any classroom in this institution
    if (!membership) {
      const enrollment = await this.prisma.enrollments.findFirst({
        where: {
          learner_user_id: studentUserId,
          classrooms: {
            institution_id: institutionId,
          },
          status: 'ACTIVE',
        },
      });

      return !!enrollment;
    }

    return !!membership;
  }

  /**
   * Get public gamification data that can be shared with peers
   * (Leaderboard position, badges - no detailed scores/errors)
   */
  async getPublicGamificationData(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        user_badges: {
          include: {
            badges: true,
          },
        },
      },
    });

    // Get streak data from streaks table
    const streak = await this.prisma.streaks.findUnique({
      where: { user_id: userId },
      select: {
        current_streak: true,
        best_streak: true,
      },
    });

    return {
      userId: user?.id,
      name: user?.name,
      currentStreak: streak?.current_streak || 0,
      longestStreak: streak?.best_streak || 0,
      badges: user?.user_badges.map((ub) => ({
        code: ub.badges.code,
        name: ub.badges.name,
        earnedAt: ub.awarded_at,
      })),
    };
  }
}
