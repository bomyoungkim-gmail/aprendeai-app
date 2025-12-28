import { PrismaClient, UserRole, InstitutionType, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Admin Seed...');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  // 1. Create System Admin
  console.log('👤 Creating System Admin...');
  const systemAdmin = await prisma.user.upsert({
    where: { email: 'admin@aprendeai.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@aprendeai.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      schoolingLevel: 'university',
    },
  });
  console.log(`✅ Created System Admin: ${systemAdmin.email}`);

  // 2. Create Institution
  console.log('🏫 Creating Institution...');
  const institution = await prisma.institution.upsert({
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
  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'tenant@institute.com' },
    update: {},
    create: {
      name: 'Tenant Admin',
      email: 'tenant@institute.com',
      passwordHash: hashedPassword,
      role: UserRole.INSTITUTION_ADMIN,
      schoolingLevel: 'university',
      institutionId: institution.id,
    },
  });

  // 4. Link Tenant Admin as Member
  console.log('🔗 Linking Tenant Admin to Institution...');
  await prisma.institutionMember.upsert({
    where: {
      institutionId_userId: {
        institutionId: institution.id,
        userId: tenantAdmin.id,
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      userId: tenantAdmin.id,
      role: UserRole.INSTITUTION_ADMIN,
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
