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
      description: 'Use systemRole + contextRole instead of single role field',
      enabled: false, // Start disabled, will enable in DEV first
      scope_type: 'GLOBAL',
    },
    {
      key: 'entitlements.scope_based',
      description: 'Use scope-based entitlement calculation (USER/FAMILY/INSTITUTION)',
      enabled: false,
      scope_type: 'GLOBAL',
    },
    {
      key: 'content.ownership_v2',
      description: 'Use ownerType/ownerId for content ownership',
      enabled: false,
      scope_type: 'GLOBAL',
    },
    {
      key: 'teacher.verification_required',
      description: 'Require teacher verification for classroom operations',
      enabled: false,
      scope_type: 'GLOBAL',
    },
  ];

  for (const flag of flags) {
    await prisma.feature_flags.upsert({
      where: {
        key_scope_type_scope_id: {
          key: flag.key,
          scope_type: flag.scope_type,
          scope_id: '',
        },
      },
      update: {
        enabled: flag.enabled,
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: flag.key,
        enabled: flag.enabled,
        scope_type: flag.scope_type,
        scope_id: '',
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
