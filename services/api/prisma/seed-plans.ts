import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  {
    code: 'FREE',
    name: 'Free Plan',
    description: 'Perfect for getting started with AprendeAI',
    isActive: true,
    monthlyPrice: null,
    yearlyPrice: null,
    entitlements: {
      features: {
        ai_chat: true,
        content_generation: true,
        basic_analytics: true,
        community_support: true,
      },
      limits: {
        api_calls_per_day: 100,
        storage_gb: 1,
        users_per_institution: 1,
        ai_tokens_per_month: 10000,
      },
    },
  },
  {
    code: 'PRO',
    name: 'Pro Plan',
    description: 'For power users who need more',
    isActive: true,
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    entitlements: {
      features: {
        ai_chat: true,
        content_generation: true,
        advanced_analytics: true,
        priority_support: true,
        api_access: true,
        custom_branding: true,
      },
      limits: {
        api_calls_per_day: 10000,
        storage_gb: 50,
        users_per_institution: 10,
        ai_tokens_per_month: 1000000,
      },
    },
  },
  {
    code: 'INSTITUTION',
    name: 'Institution Plan',
    description: 'For schools and large organizations',
    isActive: true,
    monthlyPrice: 299.99,
    yearlyPrice: 2999.99,
    entitlements: {
      features: {
        ai_chat: true,
        content_generation: true,
        advanced_analytics: true,
        dedicated_support: true,
        api_access: true,
        custom_branding: true,
        sso: true,
        admin_console: true,
        white_label: true,
      },
      limits: {
        api_calls_per_day: -1, // unlimited
        storage_gb: 500,
        users_per_institution: -1, // unlimited
        ai_tokens_per_month: -1, // unlimited
      },
    },
  },
];

async function main() {
  console.log('Seeding billing plans...');

  for (const planData of DEFAULT_PLANS) {
    const plan = await prisma.plan.upsert({
      where: { code: planData.code },
      create: planData,
      update: planData,
    });
    console.log(`✅ Seeded plan: ${plan.code} (${plan.name})`);
  }

  console.log('✅ Billing plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
