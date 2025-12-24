// Prisma seed script for test database
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test database...');

  // Create FREE plan
  const freePlan = await prisma.plan.upsert({
    where: { code: 'FREE' },
    create: {
      code: 'FREE',
      name: 'Free Plan',
      description: 'Free tier with basic features',
      isActive: true,
      entitlements: {
        features: {
          maxUsers: 1,
          maxContent: 10,
        },
        limits: {
          dailyReviews: 20,
          storageGB: 1,
        },
      },
      monthlyPrice: 0,
      yearlyPrice: 0,
    },
    update: {},
  });

  console.log('✅ Created FREE plan:', freePlan.id);

  // Create PRO plan
  const proPlan = await prisma.plan.upsert({
    where: { code: 'PRO' },
    create: {
      code: 'PRO',
      name: 'Pro Plan',
      description: 'Professional tier with advanced features',
      isActive: true,
      entitlements: {
        features: {
          maxUsers: 5,
          maxContent: 100,
        },
        limits: {
          dailyReviews: 100,
          storageGB: 10,
        },
      },
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
    },
    update: {},
  });

  console.log('✅ Created PRO plan:', proPlan.id);

  // Create test user
  // Password: Test123!@#
  // Hash generated specifically for this password
  const hashedPassword = "$2b$10$wL4gqS.1v6Z1y6/1y6/1y6/1y6/1y6/1y6/1y6/1y6" // Placeholder hash or use bcrypt if import works
  // Actually let's try to dynamic import or just use a fixed hash if we can't rely on bcrypt in seed
  
  // Real hash for 'Test123!@#' (generated online or via tool):
  // $2b$10$tM.yK.jX.9.1.1.1.1.1.1.1.1.1.1.1.1 (Just kidding)
  
  // Let's use clean code with import since we installed it
  const bcrypt = require('bcrypt');
  const passHash = await bcrypt.hash('Test123!@#', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'student@e2e-test.com' },
    update: {
      password: passHash,
      planId: proPlan.id
    },
    create: {
      email: 'student@e2e-test.com',
      name: 'E2E Student',
      password: passHash,
      role: 'STUDENT',
      planId: proPlan.id
    },
  });
  console.log('✅ Created Test User:', testUser.email);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
