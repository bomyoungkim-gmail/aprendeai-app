import { PrismaClient, ScopeType } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface BackfillStats {
  totalContents: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Backfills scope_type and scope_id from legacy owner fields
 * 
 * Mapping logic:
 * - If owner_user_id is set -> scope_type=USER, scope_id=owner_user_id
 * - If institution_id is set -> scope_type=INSTITUTION, scope_id=institution_id
 * - If family_id (legacy field if exists in model?) -> scope_type=FAMILY
 * - If owner_type='USER' -> scope_type=USER, scope_id=owner_id
 * 
 * @param dryRun If true, only logs what would be changed
 */
async function backfillScopeType(dryRun: boolean = false): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalContents: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\n🔄 Starting content scope backfill ${dryRun ? '(DRY RUN)' : ''}...\n`);

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
        scope_type: true,
        scope_id: true,
      },
    });

    // Filter contents that need migration: missing scope_id
    const contentsToMigrate = allContents.filter((content) => {
      return !content.scope_id; 
    });

    stats.totalContents = contentsToMigrate.length;

    if (stats.totalContents === 0) {
      console.log('✅ No contents need migration. All contents have scope_id set.\n');
      return stats;
    }

    console.log(`📊 Found ${stats.totalContents} contents to migrate\n`);

    for (const content of contentsToMigrate) {
      try {
        let newScopeType: ScopeType | null = null;
        let newScopeId: string | null = null;

        // Priority 1: Legacy Foreign Keys
        if (content.owner_user_id) {
            newScopeType = ScopeType.USER;
            newScopeId = content.owner_user_id;
        } else if (content.institution_id) {
            newScopeType = ScopeType.INSTITUTION;
            newScopeId = content.institution_id;
        }
        // Priority 2: Untyped owner_type/owner_id (if FKs missing)
        else if (content.owner_type === 'USER' && content.owner_id) {
            newScopeType = ScopeType.USER;
            newScopeId = content.owner_id;
        } else if (content.owner_type === 'INSTITUTION' && content.owner_id) {
            newScopeType = ScopeType.INSTITUTION;
            newScopeId = content.owner_id;
        } else if (content.owner_type === 'FAMILY' && content.owner_id) {
            newScopeType = ScopeType.FAMILY;
            newScopeId = content.owner_id;
        }

        if (!newScopeType || !newScopeId) {
            stats.skipped++;
            console.log(`⚠️  Skipping: "${content.title}" (ID: ${content.id}) - Could not determine owner`);
            continue;
        }

        console.log(`\n📄 Content: "${content.title.substring(0, 50)}..."`);
        console.log(`   ID: ${content.id}`);
        console.log(`   Setting scope: ${newScopeType} : ${newScopeId}`);

        if (!dryRun) {
          await prisma.contents.update({
            where: { id: content.id },
            data: {
              scope_type: newScopeType,
              scope_id: newScopeId,
            },
          });
          stats.updated++;
          console.log(`   ✅ Updated`);
        } else {
          stats.updated++;
          console.log(`   🔍 Would update`);
        }

      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error updating content ${content.id}:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary');
    console.log('='.repeat(60));
    console.log(`Total contents scanned:  ${stats.totalContents}`);
    console.log(`Successfully updated:    ${stats.updated}`);
    console.log(`Skipped:                 ${stats.skipped}`);
    console.log(`Errors:                  ${stats.errors}`);

    return stats;

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  backfillScopeType(dryRun);
}
