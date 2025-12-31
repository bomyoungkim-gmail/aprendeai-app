/**
 * Cleanup Script: Delete auth.context_role_v2 feature flag
 * Phase: CONTRACT (Subfase 6.4)
 * This script removes the feature flag that controlled dual-role rollout
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup: Remove feature flag...\n');

  try {
    // Step 1: Check if feature flag exists
    console.log('Step 1: Checking for feature flag...');
    const flags = await prisma.feature_flags.findMany({
      where: { key: 'auth.context_role_v2' }
    });
    
    console.log(`   Found ${flags.length} feature flag(s) for auth.context_role_v2`);
    
    if (flags.length === 0) {
      console.log('✅ Feature flag already deleted. Cleanup not needed.\n');
      return;
    }

    // Show details
    flags.forEach((flag, idx) => {
      console.log(`   Flag ${idx + 1}:`);
      console.log(`     - scope_type: ${flag.scope_type}`);
      console.log(`     - scope_id: ${flag.scope_id || 'null'}`);
      console.log(`     - enabled: ${flag.enabled}`);
    });

    // Step 2: Delete feature flag
    console.log('\nStep 2: Deleting feature flag...');
    const result = await prisma.feature_flags.deleteMany({
      where: { key: 'auth.context_role_v2' }
    });
    
    console.log(`✅ Deleted ${result.count} feature flag(s)\n`);

    // Step 3: Verify deletion
    console.log('Step 3: Verifying deletion...');
    const check = await prisma.feature_flags.findMany({
      where: { key: 'auth.context_role_v2' }
    });
    
    if (check.length === 0) {
      console.log('✅ Confirmed: feature flag no longer exists\n');
    } else {
      console.error('❌ ERROR: feature flag still exists!');
      process.exit(1);
    }

    console.log('🎉 Cleanup completed successfully!');
    console.log('   - Feature flag deleted');
    console.log('   - Dual-role system permanent');
    console.log('   - No rollback possible\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
