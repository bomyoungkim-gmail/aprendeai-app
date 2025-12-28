// @ts-nocheck
// Note: ts-nocheck required due to Prisma Client type mismatches after db pull

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ScopeType = 'GLOBAL' | 'USER' | 'INSTITUTION' | 'DEV' | 'STAGING';

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a feature flag is enabled
   * Checks in order: USER scope → INSTITUTION scope → GLOBAL scope
   */
  async isEnabled(
    flagKey: string,
    userId?: string,
    institutionId?: string,
  ): Promise<boolean> {
    // 1. Check user-specific override
    if (userId) {
      const userFlag = await this.prisma.feature_flags.findFirst({
        where: {
          key: flagKey,
          scope_type: 'USER',
          scope_id: userId,
          enabled: true,
        },
      });
      if (userFlag) return true;
    }

    // 2. Check institution-specific override
    if (institutionId) {
      const institutionFlag = await this.prisma.feature_flags.findFirst({
        where: {
          key: flagKey,
          scope_type: 'INSTITUTION',
          scope_id: institutionId,
          enabled: true,
        },
      });
      if (institutionFlag) return true;
    }

    // 3. Check DEV/STAGING environment flags
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      const devFlag = await this.prisma.feature_flags.findFirst({
        where: {
          key: flagKey,
          scope_type: 'DEV',
          enabled: true,
        },
      });
      if (devFlag) return true;
    }

    if (env === 'staging') {
      const stagingFlag = await this.prisma.feature_flags.findFirst({
        where: {
          key: flagKey,
          scope_type: 'STAGING',
          enabled: true,
        },
      });
      if (stagingFlag) return true;
    }

    // 4. Check global flag (default)
    const globalFlag = await this.prisma.feature_flags.findFirst({
      where: {
        key: flagKey,
        scope_type: 'GLOBAL',
        enabled: true,
      },
    });

    return !!globalFlag;
  }

  /**
   * Synchronous version - checks in-memory cache or returns default
   * Use this in guards where async is difficult
   */
  isEnabledSync(flagKey: string, defaultValue: boolean = false): boolean {
    // For now, return default
    // In production, this would check an in-memory cache populated by scheduled task
    return defaultValue;
  }

  /**
   * Get all enabled flags for a user/institution
   */
  async getEnabledFlags(
    userId?: string,
    institutionId?: string,
  ): Promise<string[]> {
    const flags = await this.prisma.feature_flags.findMany({
      where: {
        enabled: true,
        OR: [
          { scope_type: 'GLOBAL' },
          { scope_type: 'DEV' },
          { scope_type: 'STAGING' },
          ...(userId ? [{ scope_type: 'USER' as const, scope_id: userId }] : []),
          ...(institutionId
            ? [{ scope_type: 'INSTITUTION' as const, scope_id: institutionId }]
            : []),
        ],
      },
      select: { key: true },
    });

    return [...new Set(flags.map((f) => f.key))];
  }

  /**
   * Enable a feature flag
   */
  async enableFlag(
    flagKey: string,
    scopeType: ScopeType = 'GLOBAL',
    scopeId?: string,
  ): Promise<void> {
    await this.prisma.feature_flags.upsert({
      where: {
        key_scope_type_scope_id: {
          key: flagKey,
          scope_type: scopeType,
          scope_id: scopeId || '',
        },
      },
      update: {
        enabled: true,
        updated_at: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        key: flagKey,
        enabled: true,
        scope_type: scopeType,
        scope_id: scopeId || '',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Disable a feature flag
   */
  async disableFlag(
    flagKey: string,
    scopeType: ScopeType = 'GLOBAL',
    scopeId?: string,
  ): Promise<void> {
    await this.prisma.feature_flags.updateMany({
      where: {
        key: flagKey,
        scope_type: scopeType,
        scope_id: scopeId || '',
      },
      data: {
        enabled: false,
        updated_at: new Date(),
      },
    });
  }
}
