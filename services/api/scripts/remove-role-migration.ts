/**
 * Migration Script: Remove legacy role field from users table
 * Phase: CONTRACT (Subfase 6.3)
 * IRREVERSIBLE: This script removes the role column permanently
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Starting migration: Remove legacy role field...\n');

  try {
    // Step 1: Verify current structure
    console.log('Step 1: Checking current table structure...');
    const columns = (await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `) as any[];
    console.log(`✅ Found ${columns.length} columns in users table`);
    const hasRoleColumn = columns.some((col: any) => col.column_name === 'role');
    console.log(`   - role column exists: ${hasRoleColumn}\n`);

    if (!hasRoleColumn) {
      console.log('⚠️  Role column already removed. Migration not needed.');
      return;
    }

    // Step 2: Verify dual-role migration
    console.log('Step 2: Verifying dual-role migration...');
    const stats: any = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_users,
        COUNT(context_role) as users_with_context_role,
        COUNT(CASE WHEN system_role IS NOT NULL THEN 1 END) as users_with_system_role
      FROM users
    `;
    const { total_users, users_with_context_role, users_with_system_role } = stats[0];
    console.log(`   - Total users: ${total_users}`);
    console.log(`   - Users with context_role: ${users_with_context_role}`);
    console.log(`   - Users with system_role: ${users_with_system_role}`);

    if (Number(users_with_context_role) !== Number(total_users)) {
      console.error('\n❌ ERROR: Not all users have context_role set!');
      console.error('   Please run Phase 5 migration first.');
      process.exit(1);
    }
    console.log('✅ All users have dual-role set\n');

    // Step 3: Execute migration (IRREVERSIBLE)
    console.log('Step 3: Removing role column (IRREVERSIBLE)...');
    console.log('⚠️  WARNING: This operation cannot be undone!');
    
    await prisma.$executeRaw`ALTER TABLE users DROP COLUMN role`;
    console.log('✅ Role column removed successfully\n');

    // Step 4: Verify removal
    console.log('Step 4: Verifying column removal...');
    const checkRole = (await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `) as any[];
    
    if (checkRole.length === 0) {
      console.log('✅ Confirmed: role column no longer exists\n');
    } else {
      console.error('❌ ERROR: role column still exists!');
      process.exit(1);
    }

    // Step 5: Show final structure
    console.log('Step 5: Final table structure:');
    const finalColumns = (await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `) as any[];
    console.log('   Key columns:');
    finalColumns.forEach((col: any) => {
      if (['context_role', 'system_role', 'active_institution_id'].includes(col.column_name)) {
        console.log(`   ✅ ${col.column_name}: ${col.data_type}`);
      }
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('   - Legacy role field removed');
    console.log('   - Dual-role system active');
    console.log('   - System ready for production\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
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
