import { PrismaClient } from '@prisma/client';
import { migrateLegacyPolicy, hasLegacyKeys } from '../src/policies/legacy-policy-migration';

const prisma = new PrismaClient();

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting policy migration... ${isDryRun ? '(DRY RUN)' : '(LIVE)'}`);

  // Migrate Family Policies
  const familyPolicies = await prisma.family_policies.findMany();
  console.log(`Found ${familyPolicies.length} family policies.`);

  for (const policy of familyPolicies) {
    const json: any = policy.decision_policy_json;
    if (hasLegacyKeys(json)) {
      const migrated = migrateLegacyPolicy(json);
      const merged = { ...json, ...migrated, version: 1 };
      console.log(`[FamilyPolicy] Migrating ${policy.id}...`);
      
      if (!isDryRun) {
        await prisma.family_policies.update({
          where: { id: policy.id },
          data: { decision_policy_json: merged },
        });
      }
    }
  }

  // Migrate Institution Policies
  const institutionPolicies = await prisma.institution_policies.findMany();
  console.log(`Found ${institutionPolicies.length} institution policies.`);

  for (const policy of institutionPolicies) {
    const json: any = policy.decision_policy_json;
    if (hasLegacyKeys(json)) {
      const migrated = migrateLegacyPolicy(json);
      const merged = { ...json, ...migrated, version: 1 };
      console.log(`[InstitutionPolicy] Migrating ${policy.id}...`);

      if (!isDryRun) {
        await prisma.institution_policies.update({
          where: { id: policy.id },
          data: { decision_policy_json: merged },
        });
      }
    }
  }

  console.log('Migration complete.');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
