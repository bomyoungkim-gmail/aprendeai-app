import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying V2 Migration Schema...\n');

  // 1) Verify Users columns
  console.log('1️⃣  Checking USERS table columns...');
  const usersCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='users' 
    AND column_name IN ('system_role', 'context_role', 'institution_id', 'role', 'active_institution_id')
  `);
  console.dir(usersCols, { depth: null });
  console.log('');

  // 2) Verify FamilyMembers columns
  console.log('2️⃣  Checking FAMILY_MEMBERS table columns...');
  const famCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='family_members' 
    AND column_name IN ('learning_role', 'role')
  `);
  console.dir(famCols, { depth: null });
  console.log('');

  // 3) Verify EntitlementSnapshots columns
  console.log('3️⃣  Checking ENTITLEMENT_SNAPSHOTS table columns...');
  const entCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name='entitlement_snapshots' 
    AND column_name IN ('scope_type', 'scope_id')
  `);
  console.dir(entCols, { depth: null });
  console.log('');

  // 4) Verify InstitutionMembers role type
  console.log('4️⃣  Checking INSTITUTION_MEMBERS role type...');
  const instCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, udt_name 
    FROM information_schema.columns 
    WHERE table_name='institution_members' 
    AND column_name = 'role'
  `);
  console.dir(instCols, { depth: null });
  console.log('');

  // 5) Verify New Tables Existence
  console.log('5️⃣  Checking NEW TABLES existence...');
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' 
    AND table_name IN (
      'content_shares',
      'annotation_shares', 
      'comment_threads',
      'comments',
      'teacher_verifications',
      'institution_policies',
      'institutions'
    )
  `);
  // @ts-ignore
  const names = tables.map((t: any) => t.table_name).sort();
  console.log('Found tables:', names);
  console.log('');

  // 6) Check Institution.kind
  console.log('6️⃣  Checking Institution.kind column...');
   const instKind = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns 
    WHERE table_name='institutions' 
    AND column_name = 'kind'
  `);
  console.dir(instKind, { depth: null });

  console.log('\n✅ Verification Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
