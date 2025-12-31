import { PrismaClient, ContextRole, InstitutionRole, SystemRole, InstitutionType, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Admin Seed...');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  // 1. Create System Admin
  console.log('👤 Creating System Admin...');
  const systemAdmin = await prisma.users.upsert({
    where: { email: 'admin@aprendeai.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@aprendeai.com',
      password_hash: hashedPassword,
      system_role: SystemRole.ADMIN,
      last_context_role: ContextRole.OWNER,
      schooling_level: 'university',
    },
  });
  console.log(`✅ Created System Admin: ${systemAdmin.email}`);

  // 2. Create Institution
  console.log('🏫 Creating Institution...');
  const institution = await prisma.institutions.upsert({
    where: { slug: 'institute-test' },
    update: {},
    create: {
      name: 'Institute of Testing',
      slug: 'institute-test',
      type: InstitutionType.SCHOOL,
      city: 'São Paulo',
      country: 'Brazil',
    },
  });
  console.log(`✅ Created Institution: ${institution.name}`);

  // 3. Create Tenant Admin
  console.log('👤 Creating Tenant Admin...');
  const tenantAdmin = await prisma.users.upsert({
    where: { email: 'tenant@institute.com' },
    update: {},
    create: {
      name: 'Tenant Admin',
      email: 'tenant@institute.com',
      password_hash: hashedPassword,
      last_context_role: ContextRole.INSTITUTION_EDUCATION_ADMIN,
      schooling_level: 'university',
      last_institution_id: institution.id,
    },
  });

  // 4. Link Tenant Admin as Member
  console.log('🔗 Linking Tenant Admin to Institution...');
  await prisma.institution_members.upsert({
    where: {
      user_id: tenantAdmin.id,
    },
    update: {},
    create: {
      institution_id: institution.id,
      user_id: tenantAdmin.id,
      role: InstitutionRole.INSTITUTION_EDUCATION_ADMIN,
      status: MemberStatus.ACTIVE,
    },
  });

  console.log(`✅ Created Tenant Admin: ${tenantAdmin.email}`);
  console.log('\n🎉 Admin Seed Completed!');
  console.log('Login credentials:');
  console.log('  System Admin: admin@aprendeai.com / demo123');
  console.log('  Tenant Admin: tenant@institute.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
