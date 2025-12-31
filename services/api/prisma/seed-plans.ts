import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  {
    id: "plan_free",
    code: "FREE",
    name: "Free Plan",
    description: "Perfect for getting started with AprendeAI",
    is_active: true,
    monthly_price: 0,
    yearly_price: 0,
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
    id: "individual_premium",
    code: "PRO",
    name: "Pro Plan",
    description: "For power users who need more",
    is_active: true,
    monthly_price: 29.99,
    yearly_price: 299.99,
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
    id: "plan_family",
    code: "FAMILY",
    name: "Family Plan",
    description:
      "For families - 1 owner + up to 4 dependents with PRO features",
    is_active: true,
    monthly_price: 49.99,
    yearly_price: 499.99,
    entitlements: {
      features: {
        ai_chat: true,
        content_generation: true,
        advanced_analytics: true,
        priority_support: true,
        api_access: true,
        custom_branding: true,
        family_management: true,
      },
      limits: {
        api_calls_per_day: 10000,
        storage_gb: 250, // 50GB per member * 5 members
        users_per_family: 5, // 1 owner + 4 dependents
        ai_tokens_per_month: 5000000, // 1M per member * 5
      },
    },
  },
  {
    id: "plan_institution",
    code: "INSTITUTION",
    name: "Institution Plan",
    description:
      "For schools and large organizations with PRO features for each user",
    is_active: true,
    monthly_price: 299.99,
    yearly_price: 2999.99,
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
  console.log("Seeding billing plans...");

  for (const planSeed of DEFAULT_PLANS) {
    const plan = await prisma.plans.upsert({
      where: { id: planSeed.id },
      update: {
        name: planSeed.name,
        monthly_price: planSeed.monthly_price,
        yearly_price: planSeed.yearly_price,
        updated_at: new Date(),
      },
      create: {
        ...planSeed,
        type: planSeed.code === 'FREE' ? 'FREE' : (planSeed.code === 'FAMILY' ? 'FAMILY' : (planSeed.code === 'INSTITUTION' ? 'INSTITUTION' : 'INDIVIDUAL_PREMIUM')),
        updated_at: new Date(),
      },
    });
  }

  console.log("✅ Billing plans seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
