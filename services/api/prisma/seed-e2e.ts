import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Seed E2E Test Users
 * 
 * Creates test users needed for E2E tests
 */

const prisma = new PrismaClient();

const E2E_USERS = [
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
