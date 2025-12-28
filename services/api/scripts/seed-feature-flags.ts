// @ts-nocheck
// Note: ts-nocheck required due to Prisma Client type mismatches after db pull

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Seed initial feature flags for Phase 3 Backend Refactoring
 */
async function seedFeatureFlags() {
  console.log('🌱 Seeding feature flags...');

  const flags = [
    {
      key: 'auth.context_role_v2',
      name: 'Auth Context Roles V2',
      enabled: false, // Start disabled
      scope_type: 'GLOBAL',
      scope_id: '',
    },
    {
      key: 'entitlements.scope_based',
      name: 'Scope-Based Entitlements',
      enabled: false,
      scope_type: 'GLOBAL',
      scope_id: '',
    },
    {
      key: 'content.ownership_v2',
      name: 'Content Ownership V2',
      enabled: false,
      scope_type: 'GLOBAL',
      scope_id: '',
    },
    {
      key: 'teacher.verification_required',
      name: 'Teacher Verification Required',
      enabled: false,
      scope_type: 'GLOBAL',
      scope_id: '',
    },
  ];

  for (const flag of flags) {
    // Check if exists first
    const existing = await prisma.feature_flags.findFirst({
      where: {
        key: flag.key,
        scope_type: flag.scope_type,
        scope_id: flag.scope_id,
      },
    });

    if (existing) {
      console.log(`  ⏭️  ${flag.key} already exists (skipping)`);
      continue;
    }

    // Create new flag
    await prisma.feature_flags.create({
      data: {
        id: randomUUID(),
        key: flag.key,
        name: flag.name,
        enabled: flag.enabled,
        scope_type: flag.scope_type,
        scope_id: flag.scope_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`  ✅ ${flag.key} (${flag.scope_type}) - ${flag.enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  console.log('\n✅ Feature flags seeded successfully!\n');
}

async function main() {
  try {
    await seedFeatureFlags();
  } catch (error) {
    console.error('❌ Error seeding feature flags:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { seedFeatureFlags };
