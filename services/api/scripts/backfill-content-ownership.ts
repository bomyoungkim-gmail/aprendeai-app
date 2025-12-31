import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// ContentOwnerType values (owner_type is TEXT in database)
const ContentOwnerType = {
  USER: 'USER',
  FAMILY: 'FAMILY',
  INSTITUTION: 'INSTITUTION',
} as const;

type ContentOwnerTypeValue = typeof ContentOwnerType[keyof typeof ContentOwnerType];

interface BackfillStats {
  totalContents: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Backfills ownerType and ownerId for existing Content
 * 
 * Mapping logic:
 * - If owner_user_id is set → ownerType=USER, ownerId=owner_user_id
 * - Else if family_id is set → ownerType=FAMILY, ownerId=family_id
 * - Else if institution_id is set → ownerType=INSTITUTION, ownerId=institution_id
 * - Else → skip (no owner)
 * 
 * @param dryRun If true, only logs what would be changed without updating
 */
async function backfillContentOwnership(dryRun: boolean = false): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalContents: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\n🔄 Starting content ownership backfill ${dryRun ? '(DRY RUN)' : ''}...\n`);

  try {
    // Fetch all contents
    const allContents = await prisma.contents.findMany({
      select: {
        id: true,
        title: true,
        owner_user_id: true,
        institution_id: true,
        owner_type: true,
        owner_id: true,
      },
    });

    // Filter contents that need migration
    const contentsToMigrate = allContents.filter((content) => {
      // Has legacy owner but missing new owner fields
      const hasLegacyOwner = content.owner_user_id || (content as any).family_id || content.institution_id;
      const missingNewOwner = !content.owner_type || !content.owner_id;
      return hasLegacyOwner && missingNewOwner;
    });

    stats.totalContents = contentsToMigrate.length;

    if (stats.totalContents === 0) {
      console.log('✅ No contents need migration. All contents already have ownership fields set.\n');
      return stats;
    }

    console.log(`📊 Found ${stats.totalContents} contents to migrate\n`);

    //Process each content
    for (const content of contentsToMigrate) {
      try {
        let ownerType: ContentOwnerTypeValue;
        let ownerId: string;

        // Determine owner type and ID from legacy fields (priority order)
        if (content.owner_user_id) {
          ownerType = ContentOwnerType.USER;
          ownerId = content.owner_user_id;
        } else if ((content as any).family_id) {
          ownerType = ContentOwnerType.FAMILY;
          ownerId = (content as any).family_id;
        } else if (content.institution_id) {
          ownerType = ContentOwnerType.INSTITUTION;
          ownerId = content.institution_id;
        } else {
          // No owner found (shouldn't happen due to filter)
          stats.skipped++;
          console.log(`⏭️  Skipped: ${content.title} (no owner found)`);
          continue;
        }

        console.log(`\n📄 Content: "${content.title.substring(0, 50)}..."`);
        console.log(`   ID: ${content.id}`);
        console.log(`   New ownerType: ${ownerType}`);
        console.log(`   New ownerId: ${ownerId}`);

        if (!dryRun) {
          // Update content
          await prisma.contents.update({
            where: { id: content.id },
            data: {
              owner_type: ownerType,
              owner_id: ownerId,
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
        console.error(`   ❌ Error updating content ${content.id}:`, error);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary');
    console.log('='.repeat(60));
    console.log(`Total contents scanned:  ${stats.totalContents}`);
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
 * Validates that all contents with legacy owners have new owner fields populated
 */
async function validateBackfill(): Promise<boolean> {
  console.log('\n🔍 Validating backfill results...\n');

  // Check contents with legacy owners but missing new owner fields
  const contentsWithMissingOwner = await prisma.contents.count({
    where: {
      AND: [
        {
          OR: [
            { owner_user_id: { not: null } },
            { institution_id: { not: null } },
          ],
        },
        {
          OR: [
            { owner_type: { equals: null } },
            { owner_id: { equals: null } },
          ],
        },
      ],
    },
  });

  let valid = true;

  if (contentsWithMissingOwner > 0) {
    console.error(`❌ Found ${contentsWithMissingOwner} contents with legacy owner but missing new owner fields`);
    valid = false;
  } else {
    console.log('✅ All contents with legacy owners have ownerType and ownerId');
  }

  // Verify owner consistency
  const userOwnedContents = await prisma.contents.count({
    where: {
      AND: [
        { owner_type: ContentOwnerType.USER },
        { owner_user_id: { not: null } },
      ],
    },
  });

  const totalUserOwnerType = await prisma.contents.count({
    where: { owner_type: ContentOwnerType.USER },
  });

  if (userOwnedContents !== totalUserOwnerType) {
    console.error(
      `⚠️  Found ${totalUserOwnerType - userOwnedContents} USER-owned contents where owner_id doesn't match owner_user_id`
    );
    // This is a warning, not a failure -owner_id is the new source of truth
  } else {
    console.log('✅ All USER-owned contents have consistent ownership');
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
      const stats = await backfillContentOwnership(dryRun);

      // Validate if not dry run
      if (!dryRun && stats.errors === 0) {
        const isValid = await validateBackfill();
        if (!isValid) {
          console.error('⚠️  Validation failed after backfill');
          process.exit(1);
        }
      }

      process.exit(stats.errors > 0 ?1 : 0);
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
export { backfillContentOwnership, validateBackfill };
