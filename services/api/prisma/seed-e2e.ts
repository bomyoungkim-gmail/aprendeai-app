import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed E2E Test Users
 * 
 * Creates test users needed for E2E tests
 */

const prisma = new PrismaClient();

const E2E_USERS = [
  {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'COMMON_USER',
    schoolingLevel: 'UNIVERSITY',
  },
  {
    email: 'facilitator@e2e-test.com',
    password: 'Test123!@#',
    name: 'E2E Facilitator',
    role: 'COMMON_USER',
    schoolingLevel: 'UNIVERSITY',
  },
  {
    email: 'member1@e2e-test.com',
    password: 'Test123!@#',
    name: 'E2E Member 1',
    role: 'COMMON_USER',
    schoolingLevel: 'UNIVERSITY',
  },
  {
    email: 'member2@e2e-test.com',
    password: 'Test123!@#',
    name: 'E2E Member 2',
    role: 'COMMON_USER',
    schoolingLevel: 'UNIVERSITY',
  },
  // Family Plan E2E test users
  {
    email: 'owner@family-test.com',
    password: 'Test123!@#',
    name: 'Family Owner',
    role: 'COMMON_USER',
    schoolingLevel: 'UNDERGRADUATE',
  },
  {
    email: 'existing@family-test.com',
    password: 'Test123!@#',
    name: 'Existing User',
    role: 'COMMON_USER',
    schoolingLevel: 'UNDERGRADUATE',
  },
  {
    email: 'nonowner@family-test.com',
    password: 'Test123!@#',
    name: 'Non Owner',
    role: 'COMMON_USER',
    schoolingLevel: 'UNDERGRADUATE',
  },
  {
    email: 'outsider@family-test.com',
    password: 'Test123!@#',
    name: 'Outsider',
    role: 'COMMON_USER',
    schoolingLevel: 'UNDERGRADUATE',
  },
];

async function main() {
  console.log('🌱 Seeding E2E test users...');
  
  // Get default institution
  const institution = await prisma.institution.findFirst();
  if (!institution) {
    throw new Error('No institution found. Please run main seed first.');
  }
  console.log(`Using institution: ${institution.name} (${institution.id})`);
  
  // First, ensure Plans exist (required for subscriptions during login)
  console.log('📋 Ensuring Plans exist...');
  
  await prisma.plan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      code: 'FREE',
      name: 'Free Plan',
      description: 'Basic free tier',
      isActive: true,
      entitlements: {
        maxContentUploads: 10,
        maxStorageGB: 1,
        canUseAI: false,
      },
    },
  });

  await prisma.plan.upsert({
    where: { code: 'INDIVIDUAL' },
    update: {},
    create: {
      code: 'INDIVIDUAL',
      name: 'Individual Plan',
      description: 'For individual users',
      isActive: true,
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      entitlements: {
        maxContentUploads: 1000,
        maxStorageGB: 100,
        canUseAI: true,
      },
    },
  });

  await prisma.plan.upsert({
    where: { code: 'FAMILY' },
    update: {},
    create: {
      code: 'FAMILY',
      name: 'Family Plan',
      description: 'For families and groups',
      isActive: true,
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      entitlements: {
        maxContentUploads: 5000,
        maxStorageGB: 500,
        maxFamilyMembers: 6,
        canUseAI: true,
      },
    },
  });

  console.log('✅ Plans created/updated');


  for (const userData of E2E_USERS) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`✓ User ${userData.email} already exists`);
      continue;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role as any,
        schoolingLevel: userData.schoolingLevel,
        institutionId: institution.id,
      },
    });

    console.log(`✓ Created user: ${user.email}`);
  }

  console.log('✅ E2E test users seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('Email: facilitator@e2e-test.com | Password: Test123!@#');
  console.log('Email: member1@e2e-test.com | Password: Test123!@#');
  console.log('Email: member2@e2e-test.com | Password: Test123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding E2E users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
