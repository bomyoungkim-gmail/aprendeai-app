/**
 * Backfill institution_id for all tables
 * 
 * Phase 0: Multi-Tenancy - Stage 2
 * Run after Stage 1 migration is deployed
 * 
 * Strategy: Populate from users.institution_id with default fallback
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillInstitutionId() {
  console.log('='.repeat(50));
  console.log('Backfill institution_id - Stage 2');
  console.log('='.repeat(50));
  
  // Get or create default institution
  let defaultInstitution = await prisma.institution.findFirst();
  
  if (!defaultInstitution) {
    console.log('⚠️  No institution found. Creating default...');
    defaultInstitution = await prisma.institution.create({
      data: {
        name: 'Default Institution',
        type: 'UNIVERSITY',
        city: 'Unknown',
        country: 'Unknown',
      },
    });
    console.log(`✅ Created default institution: ${defaultInstitution.id}`);
  } else {
    console.log(`✅ Using existing institution: ${defaultInstitution.id} (${defaultInstitution.name})`);
  }
  
  const defaultId = defaultInstitution.id;
  
  // 1. Backfill reading_sessions
  console.log('\n1️⃣  Backfilling reading_sessions...');
  const rs = await prisma.$executeRaw`
    UPDATE reading_sessions rs
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE rs.user_id = u.id AND rs.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${rs} rows`);
  
  // 2. Backfill session_events (via reading_sessions)
  console.log('\n2️⃣  Backfilling session_events...');
  const se = await prisma.$executeRaw`
    UPDATE session_events se
    SET institution_id = rs.institution_id
    FROM reading_sessions rs
    WHERE se.reading_session_id = rs.id AND se.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${se} rows`);
  
  // 3. Backfill user_vocabulary
  console.log('\n3️⃣  Backfilling user_vocabulary...');
  const uv = await prisma.$executeRaw`
    UPDATE user_vocabulary uv
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE uv.user_id = u.id AND uv.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${uv} rows`);
  
  // 4. Backfill cornell_notes
  console.log('\n4️⃣  Backfilling cornell_notes...');
  const cn = await prisma.$executeRaw`
    UPDATE cornell_notes cn
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE cn.user_id = u.id AND cn.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${cn} rows`);
  
  // 5. Backfill highlights
  console.log('\n5️⃣  Backfilling highlights...');
  const h = await prisma.$executeRaw`
    UPDATE highlights h
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE h.user_id = u.id AND h.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${h} rows`);
  
  // 6. Backfill daily_goals
  console.log('\n6️⃣  Backfilling daily_goals...');
  const dg = await prisma.$executeRaw`
    UPDATE daily_goals dg
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE dg.user_id = u.id AND dg.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${dg} rows`);
  
  // 7. Backfill streaks
  console.log('\n7️⃣  Backfilling streaks...');
  const s = await prisma.$executeRaw`
    UPDATE streaks s
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE s.user_id = u.id AND s.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${s} rows`);
  
  // 8. Backfill user_badges
  console.log('\n8️⃣  Backfilling user_badges...');
  const ub = await prisma.$executeRaw`
    UPDATE user_badges ub
    SET institution_id = COALESCE(u.institution_id, ${defaultId}::uuid)
    FROM users u
    WHERE ub.user_id = u.id AND ub.institution_id IS NULL
  `;
  console.log(`   ✅ Updated ${ub} rows`);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Backfill complete!');
  console.log('='.repeat(50));
  
  // Validation
  console.log('\n🔍 Validating (checking for NULLs)...');
  const validation = await prisma.$queryRaw<Array<{table_name: string, null_count: bigint}>>`
    SELECT 'reading_sessions' as table_name, COUNT(*) as null_count
    FROM reading_sessions WHERE institution_id IS NULL
    UNION ALL
    SELECT 'session_events', COUNT(*) FROM session_events WHERE institution_id IS NULL
    UNION ALL
    SELECT 'user_vocabulary', COUNT(*) FROM user_vocabulary WHERE institution_id IS NULL
    UNION ALL
    SELECT 'cornell_notes', COUNT(*) FROM cornell_notes WHERE institution_id IS NULL
    UNION ALL
    SELECT 'highlights', COUNT(*) FROM highlights WHERE institution_id IS NULL
    UNION ALL
    SELECT 'daily_goals', COUNT(*) FROM daily_goals WHERE institution_id IS NULL
    UNION ALL
    SELECT 'streaks', COUNT(*) FROM streaks WHERE institution_id IS NULL
    UNION ALL
    SELECT 'user_badges', COUNT(*) FROM user_badges WHERE institution_id IS NULL
  `;
  
  console.log('\nValidation Results:');
  console.table(validation);
  
  const hasNulls = validation.some(row => Number(row.null_count) > 0);
  if (hasNulls) {
    console.error('\n❌ ERROR: Some tables still have NULL institution_id!');
    console.error('   Fix these before proceeding to Stage 3 (NOT NULL)');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed: Zero NULL values');
    console.log('\n📝 Next step: Run Stage 3 migration (NOT NULL constraints)');
  }
}

backfillInstitutionId()
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
