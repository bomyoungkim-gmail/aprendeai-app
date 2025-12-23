// Simple seed for test database
// Run with: NODE_ENV=test DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/aprendeai npx ts-node scripts/seed-test.ts

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

  console.log('✅ Created FREE plan:', freePlan.code);

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
