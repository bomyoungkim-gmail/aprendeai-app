// Setup test database using Prisma
// Run with: npm run test:db:setup

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const TEST_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/aprendeai_test';

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  console.log('📦 Database:', TEST_DB_URL);

  // Set environment
  process.env.DATABASE_URL = TEST_DB_URL;

  try {
    // Push schema (creates/updates schema without migration files)
    console.log('🚀 Pushing Prisma schema...');
    execSync('npx prisma db push --accept-data-loss --skip-generate --schema=../db/schema.prisma', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    });

    // Seed database
    console.log('🌱 Seeding database...');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DB_URL,
        },
      },
    });

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

    // Create PRO plan
    const proPlan = await prisma.plan.upsert({
      where: { code: 'PRO' },
      create: {
        code: 'PRO',
        name: 'Pro Plan',
        description: 'Professional tier',
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

    console.log('✅ Created PRO plan:', proPlan.code);

    await prisma.$disconnect();

    console.log('🎉 Test database setup complete!');
    console.log('You can now run: npm run test:integration');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupTestDatabase();
