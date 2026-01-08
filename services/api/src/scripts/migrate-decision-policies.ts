/**
 * Migration Script: Normalize Decision Policies
 * 
 * One-time script to migrate existing decision_policy_json records
 * from legacy format to DecisionPolicyV1.
 * 
 * Usage:
 *   npx ts-node src/scripts/migrate-decision-policies.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import { migrateLegacyPolicy, hasLegacyKeys } from '../policies/legacy-policy-migration';
import { DecisionPolicyV1Schema } from '../policies/decision-policy.schema';

const prisma = new PrismaClient();

interface MigrationStats {
  institutionPoliciesChecked: number;
  institutionPoliciesMigrated: number;
  familyPoliciesChecked: number;
  familyPoliciesMigrated: number;
  errors: string[];
}

async function migrateInstitutionPolicies(dryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    institutionPoliciesChecked: 0,
    institutionPoliciesMigrated: 0,
    familyPoliciesChecked: 0,
    familyPoliciesMigrated: 0,
    errors: [],
  };

  console.log('\\n=== Migrating Institution Policies ===');
  
  const institutions = await prisma.institution_policies.findMany({
    select: {
      id: true,
      institution_id: true,
      decision_policy_json: true,
    },
  });

  stats.institutionPoliciesChecked = institutions.length;

  for (const inst of institutions) {
    try {
      const policy = inst.decision_policy_json as any;
      
      if (hasLegacyKeys(policy)) {
        console.log(`  Migrating institution policy: ${inst.institution_id}`);
        
        const migrated = migrateLegacyPolicy(policy);
        const validated = DecisionPolicyV1Schema.parse(migrated);
        
        if (!dryRun) {
          await prisma.institution_policies.update({
            where: { id: inst.id },
            data: { decision_policy_json: validated as any },
          });
        }
        
        stats.institutionPoliciesMigrated++;
        console.log(`    ✓ Migrated (dry-run: ${dryRun})`);
      }
    } catch (error) {
      const errorMsg = `Failed to migrate institution ${inst.institution_id}: ${error}`;
      console.error(`    ✗ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  return stats;
}

async function migrateFamilyPolicies(dryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    institutionPoliciesChecked: 0,
    institutionPoliciesMigrated: 0,
    familyPoliciesChecked: 0,
    familyPoliciesMigrated: 0,
    errors: [],
  };

  console.log('\\n=== Migrating Family Policies ===');
  
  const families = await prisma.family_policies.findMany({
    select: {
      id: true,
      family_id: true,
      learner_user_id: true,
      decision_policy_json: true,
    },
  });

  stats.familyPoliciesChecked = families.length;

  for (const fam of families) {
    try {
      const policy = fam.decision_policy_json as any;
      
      if (hasLegacyKeys(policy)) {
        console.log(`  Migrating family policy: ${fam.family_id} (learner: ${fam.learner_user_id})`);
        
        const migrated = migrateLegacyPolicy(policy);
        const validated = DecisionPolicyV1Schema.parse(migrated);
        
        if (!dryRun) {
          await prisma.family_policies.update({
            where: { id: fam.id },
            data: { decision_policy_json: validated as any },
          });
        }
        
        stats.familyPoliciesMigrated++;
        console.log(`    ✓ Migrated (dry-run: ${dryRun})`);
      }
    } catch (error) {
      const errorMsg = `Failed to migrate family ${fam.family_id}: ${error}`;
      console.error(`    ✗ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  return stats;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('Decision Policy Migration Script');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(50));

  try {
    const instStats = await migrateInstitutionPolicies(dryRun);
    const famStats = await migrateFamilyPolicies(dryRun);

    console.log('\\n=== Migration Summary ===');
    console.log(`Institution Policies:`);
    console.log(`  Checked: ${instStats.institutionPoliciesChecked}`);
    console.log(`  Migrated: ${instStats.institutionPoliciesMigrated}`);
    console.log(`Family Policies:`);
    console.log(`  Checked: ${famStats.familyPoliciesChecked}`);
    console.log(`  Migrated: ${famStats.familyPoliciesMigrated}`);
    
    const totalErrors = instStats.errors.length + famStats.errors.length;
    if (totalErrors > 0) {
      console.log(`\\n⚠️  Errors: ${totalErrors}`);
      [...instStats.errors, ...famStats.errors].forEach(err => console.error(`  - ${err}`));
    }

    if (dryRun) {
      console.log('\\n💡 Run without --dry-run to apply changes');
    } else {
      console.log('\\n✅ Migration complete');
    }
  } catch (error) {
    console.error('\\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
