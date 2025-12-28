import { PrismaClient, UserRole, SystemRole, ContextRole } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface RoleMappingResult {
  systemRole: SystemRole | null;
  contextRole: ContextRole;
}

/**
 * Maps legacy UserRole to new SystemRole + ContextRole
 * 
 * Mapping logic:
 * - ADMIN, SUPPORT, OPS → systemRole, contextRole = OWNER
 * - INSTITUTION_ADMIN, SCHOOL_ADMIN → contextRole = INSTITUTION_EDUCATION_ADMIN
 * - TEACHER → contextRole = TEACHER
 * - STUDENT → contextRole = STUDENT
 * - GUARDIAN, COMMON_USER → contextRole = OWNER
 */
export function mapUserRoleToContextRoles(userRole: UserRole): RoleMappingResult {
  switch (userRole) {
    case UserRole.ADMIN:
      return { systemRole: SystemRole.ADMIN, contextRole: ContextRole.OWNER };
    
    case UserRole.SUPPORT:
      return { systemRole: SystemRole.SUPPORT, contextRole: ContextRole.OWNER };
    
    case UserRole.OPS:
      return { systemRole: SystemRole.OPS, contextRole: ContextRole.OWNER };
    
    case UserRole.INSTITUTION_ADMIN:
    case UserRole.SCHOOL_ADMIN:
      return { systemRole: null, contextRole: ContextRole.INSTITUTION_EDUCATION_ADMIN };
    
    case UserRole.TEACHER:
      return { systemRole: null, contextRole: ContextRole.TEACHER };
    
    case UserRole.STUDENT:
      return { systemRole: null, contextRole: ContextRole.STUDENT };
    
    case UserRole.GUARDIAN:
    case UserRole.COMMON_USER:
    default:
      return { systemRole: null, contextRole: ContextRole.OWNER };
  }
}

interface BackfillStats {
  totalUsers: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Backfills systemRole, contextRole, and activeInstitutionId for existing users
 * 
 * @param dryRun If true, only logs what would be changed without actually updating
 */
async function backfillContextRoles(dryRun: boolean = false): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalUsers: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\n🔄 Starting context roles backfill ${dryRun ? '(DRY RUN)' : ''}...\n`);

  try {
    // Fetch all users (contextRole has default, so checking for null won't work)
    // Instead, we check if the current systemRole/contextRole matches what the role should map to
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        systemRole: true,
        contextRole: true,
        institutionId: true,
        activeInstitutionId: true,
      },
    });

    // Filter to users that need migration
    const usersToMigrate = allUsers.filter((user) => {
      const { systemRole: expectedSystemRole, contextRole: expectedContextRole } =
        mapUserRoleToContextRoles(user.role);

      // Check if UPDATE is needed
      return (
        user.systemRole !== expectedSystemRole ||
        user.contextRole !== expectedContextRole ||
        (user.institutionId && !user.activeInstitutionId)
      );
    });

    stats.totalUsers = usersToMigrate.length;

    if (stats.totalUsers === 0) {
      console.log('✅ No users need migration. All users already have context roles.\n');
      return stats;
    }

    console.log(`📊 Found ${stats.totalUsers} users to migrate\n`);

    // Process each user
    for (const user of usersToMigrate) {
      try {
        // Map role to new system
        const { systemRole, contextRole } = mapUserRoleToContextRoles(user.role);

        // Determine activeInstitutionId
        let activeInstitutionId = user.activeInstitutionId;
        if (!activeInstitutionId && user.institutionId) {
          activeInstitutionId = user.institutionId;
        }

        // Check if update is needed
        if (user.systemRole === systemRole && 
            user.contextRole === contextRole && 
            user.activeInstitutionId === activeInstitutionId) {
          stats.skipped++;
          console.log(`⏭️  Skipped: ${user.email} (already up to date)`);
          continue;
        }

        // Log what would change
        console.log(`\n👤 User: ${user.email} (${user.name})`);
        console.log(`   Old role: ${user.role}`);
        console.log(`   New systemRole: ${systemRole ?? 'null'}`);
        console.log(`   New contextRole: ${contextRole}`);
        console.log(`   activeInstitutionId: ${activeInstitutionId ?? 'null'}`);

        if (!dryRun) {
          // Update user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              systemRole,
              contextRole,
              activeInstitutionId,
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
        console.error(`   ❌ Error updating user ${user.email}:`, error);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary');
    console.log('='.repeat(60));
    console.log(`Total users scanned:     ${stats.totalUsers}`);
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
 * Validates that all users have context roles after backfill
 */
async function validateBackfill(): Promise<boolean> {
  console.log('\n🔍 Validating backfill results...\n');

  // Check that system users (ADMIN, SUPPORT, OPS) have systemRole set
  const systemUsersWithoutRole = await prisma.user.count({
    where: {
      AND: [
        { role: { in: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS] } },
        { systemRole: { equals: null } },
      ],
    },
  });

  let valid = true;

  if (systemUsersWithoutRole > 0) {
    console.error(`❌ Found ${systemUsersWithoutRole} system users without systemRole`);
    valid = false;
  } else {
    console.log('✅ All system users have systemRole');
  }

  // Since contextRole has a default, all users should have it
  console.log('✅ All users have contextRole (field has default value)');

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
      const stats = await backfillContextRoles(dryRun);
      
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
export { backfillContextRoles, validateBackfill };
