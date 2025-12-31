import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContentAccessService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Main entry point: Check if user can access content
   * CACHED for 5 minutes to avoid repeated DB queries
   */
  async canAccessContent(contentId: string, userId: string): Promise<boolean> {
    const cacheKey = `content:access:${contentId}:${userId}`;

    // Try cache first
    const cached = await this.cacheManager.get<boolean>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - compute permission
    const hasAccess = await this._checkAccess(contentId, userId);

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, hasAccess, 5 * 60 * 1000);

    return hasAccess;
  }

  private async _checkAccess(
    contentId: string,
    userId: string,
  ): Promise<boolean> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        owner_type: true,
        owner_id: true,
        created_by: true,
        scope_type: true,
        scope_id: true,
        institution_id: true,
      },
    });

    if (!content) return false;

    // 1. Direct ownership
    if (this.isOwner(content, userId)) return true;

    // 2. Family sharing
    if (await this.hasFamilyAccess(content, userId)) return true;

    // 3. Institution sharing
    if (await this.hasInstitutionAccess(content, userId)) return true;

    // 4. Study group (future)
    // if (await this.hasStudyGroupAccess(content, userId)) return true;

    return false;
  }

  private isOwner(content: any, userId: string): boolean {
    return content.owner_user_id === userId || content.created_by === userId;
  }

  /**
   * Family access - check if user is in owner's primary family
   * Applies to: scopeType = FAMILY or USER
   */
  private async hasFamilyAccess(
    content: any,
    userId: string,
  ): Promise<boolean> {
    if (content.scope_type !== "FAMILY" && content.scope_type !== "USER") {
      return false;
    }

    if (!content.owner_user_id) return false;

    // Get owner's primary family
    const ownerUser = await this.prisma.users.findUnique({
      where: { id: content.owner_user_id },
      select: { settings: true },
    });

    const primaryFamilyId = (ownerUser?.settings as any)?.primaryFamilyId;
    if (!primaryFamilyId) return false;

    // Check if user is active member of that family
    const familyMember = await this.prisma.family_members.findUnique({
      where: {
        family_id_user_id: {
          family_id: primaryFamilyId,
          user_id: userId,
        },
      },
      select: { status: true },
    });

    return familyMember?.status === "ACTIVE";
  }

  /**
   * Institution access - check if user is in same institution
   * Applies to: scopeType = INSTITUTION
   */
  private async hasInstitutionAccess(
    content: any,
    userId: string,
  ): Promise<boolean> {
    if (content.scope_type !== "INSTITUTION") {
      return false;
    }

    if (!content.institution_id) return false;

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { last_institution_id: true },
    });

    return user?.last_institution_id === content.institution_id;
  }

  /**
   * Check file access (files are accessed through content)
   * CACHED for 5 minutes
   */
  async canAccessFile(fileId: string, userId: string): Promise<boolean> {
    const cacheKey = `file:access:${fileId}:${userId}`;

    const cached = await this.cacheManager.get<boolean>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const content = await this.prisma.contents.findFirst({
      where: { file_id: fileId },
      select: { id: true },
    });

    if (!content) {
      // File exists but not linked to content (e.g., avatar)
      // For now, allow - TODO: add avatar ownership check
      return true;
    }

    const hasAccess = await this.canAccessContent(content.id, userId);
    await this.cacheManager.set(cacheKey, hasAccess, 5 * 60 * 1000);

    return hasAccess;
  }

  /**
   * Cache invalidation when permissions change
   * Note: For MVP, TTL handles invalidation automatically
   * For production, implement event-driven invalidation
   */
  async invalidateUserAccess(userId: string): Promise<void> {
    // TODO: Clear all cached permissions for this user
    // Requires Redis with pattern matching (SCAN + DEL)
    // For now, TTL expiration handles this after 5 minutes
  }

  async invalidateContentAccess(contentId: string): Promise<void> {
    // TODO: Clear all cached permissions for this content
    // For now, TTL expiration handles this after 5 minutes
  }
}
