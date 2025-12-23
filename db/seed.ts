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
