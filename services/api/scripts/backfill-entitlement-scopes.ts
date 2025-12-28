import { PrismaClient, ScopeType } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface BackfillStats {
  totalSnapshots: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Backfills scopeType and scopeId for existing EntitlementSnapshots
 * All existing snapshots are USER-scoped (scopeType = USER, scopeId = userId)
 * 
 * @param dryRun If true, only logs what would be changed without updating
 */
async function backfillEntitlementScopes(dryRun: boolean = false): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalSnapshots: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\n🔄 Starting entitlement scopes backfill ${dryRun ? '(DRY RUN)' : ''}...\n`);

  try {
    // Fetch all snapshots (scopeType and scopeId are nullable)
    const allSnapshots = await prisma.entitlement_snapshots.findMany({
      select: {
        id: true,
        user_id: true,
        scope_type: true,
        scope_id: true,
      },
    });

    //Filter snapshots that need migration
    const snapshotsToMigrate = allSnapshots.filter(
      (snapshot) => !snapshot.scope_type || !snapshot.scope_id
    );

    stats.totalSnapshots = snapshotsToMigrate.length;

    if (stats.totalSnapshots === 0) {
      console.log('✅ No snapshots need migration. All snapshots already have scope fields set.\n');
      return stats;
    }

    console.log(`📊 Found ${stats.totalSnapshots} snapshots to migrate\n`);

    // Process each snapshot
    for (const snapshot of snapshotsToMigrate) {
      try {
        console.log(`\n📸 Snapshot ID: ${snapshot.id}`);
        console.log(`   User ID: ${snapshot.user_id}`);
        console.log(`   New scopeType: USER`);
        console.log(`   New scopeId: ${snapshot.user_id}`);

        if (!dryRun) {
          // Update snapshot
          await prisma.entitlement_snapshots.update({
            where: { id: snapshot.id },
            data: {
              scope_type: ScopeType.USER,
              scope_id: snapshot.user_id,
            },
          });

          stats.updated++;
          console.log(`   ✅ Updated`);
        } else {
          stats.updated++;
          console.log(`   🔍 Would update (dry run)`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error updating snapshot ${snapshot.id}:`, error);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary');
    console.log('='.repeat(60));
    console.log(`Total snapshots scanned: ${stats.totalSnapshots}`);
    console.log(`Successfully updated:    ${stats.updated}`);
    console.log(`Skipped (no changes):    ${stats.skipped}`);
    console.log(`Errors:                  ${stats.errors}`);
    console.log('='.repeat(60) + '\n');

    if (dryRun) {
      console.log('🔍 This was a DRY RUN. No data was modified.');
      console.log('   Run without --dry-run flag to apply changes.\n');
    } else {
      console.log('✅ Backfill completed successfully!\n');
    }

    return stats;
  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    throw error;
  }
}

/**
 * Validates that all snapshots have scope fields after backfill
 */
async function validateBackfill(): Promise<boolean> {
  console.log('\n🔍 Validating backfill results...\n');

  const snapshotsWithoutScope = await prisma.entitlement_snapshots.count({
    where: {
      OR: [
        { scope_type: { equals: null } },
        { scope_id: { equals: null } },
      ],
    },
  });

  let valid = true;

  if (snapshotsWithoutScope > 0) {
    console.error(`❌ Found ${snapshotsWithoutScope} snapshots without scope fields`);
    valid = false;
  } else {
    console.log('✅ All entitlement snapshots have scopeType and scopeId');
  }

  // Check that all USER-scoped snapshots have scopeId matching userId
  const userSnapshots = await prisma.entitlement_snapshots.findMany({
    where: { scope_type: ScopeType.USER },
    select: { id: true, user_id: true, scope_id: true },
  });

  const mismatchedSnapshots = userSnapshots.filter(
    (s) => s.scope_id !== s.user_id
  );

  if (mismatchedSnapshots.length > 0) {
    console.error(
      `❌ Found ${mismatchedSnapshots.length} USER snapshots where scopeId !== userId`
    );
    valid = false;
  } else {
    console.log('✅ All USER snapshots have correct scopeId (matches userId)');
  }

  console.log('');
  return valid;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const validate = args.includes('--validate');

  try {
    if (validate) {
      // Just validate
      const isValid = await validateBackfill();
      process.exit(isValid ? 0 : 1);
    } else {
      // Run backfill
      const stats = await backfillEntitlementScopes(dryRun);

      // Validate if not dry run
      if (!dryRun && stats.errors === 0) {
        const isValid = await validateBackfill();
        if (!isValid) {
          console.error('⚠️  Validation failed after backfill');
          process.exit(1);
        }
      }

      process.exit(stats.errors > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing
export { backfillEntitlementScopes, validateBackfill };
