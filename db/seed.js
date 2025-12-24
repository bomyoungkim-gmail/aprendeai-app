const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

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
        features: { maxUsers: 1, maxContent: 10 },
        limits: { dailyReviews: 20, storageGB: 1 },
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
        features: { maxUsers: 5, maxContent: 100 },
        limits: { dailyReviews: 100, storageGB: 10 },
      },
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
    },
    update: {},
  });
  console.log('✅ Created PRO plan:', proPlan.id);

  // Create test user
  const email = 'student@e2e-test.com';
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  const testUser = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      planId: proPlan.id
    },
    create: {
      email,
      name: 'E2E Student',
      password: hashedPassword,
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
