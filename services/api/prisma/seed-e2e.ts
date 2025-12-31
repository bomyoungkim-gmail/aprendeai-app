import { PrismaClient, InstitutionType, ContextRole, AssetLayer, SessionModality } from '@prisma/client';
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
    context_role: ContextRole.STUDENT,
    schooling_level: 'SUPERIOR',
  },
  {
    email: 'facilitator@e2e-test.com',
    password: 'Test123!@#',
    name: 'E2E Facilitator',
    context_role: ContextRole.TEACHER,
    schooling_level: 'SUPERIOR',
  },
  {
    email: 'member1@e2e-test.com',
    password: 'Test123!@#',
    name: 'E2E Member 1',
    context_role: ContextRole.STUDENT,
    schooling_level: 'SUPERIOR',
  },
  {
    email: 'member2@e2e-test.com',
    password: 'Test123!@#',
    name: 'E2E Member 2',
    context_role: ContextRole.STUDENT,
    schooling_level: 'SUPERIOR',
  },
  // Family Plan E2E test users
  {
    email: 'owner@family-test.com',
    password: 'Test123!@#',
    name: 'Family Owner',
    context_role: ContextRole.OWNER,
    schooling_level: 'SUPERIOR',
  },
  {
    email: 'existing@family-test.com',
    password: 'Test123!@#',
    name: 'Existing User',
    context_role: ContextRole.STUDENT,
    schooling_level: 'SUPERIOR',
  },
  {
    email: 'nonowner@family-test.com',
    password: 'Test123!@#',
    name: 'Non Owner',
    context_role: ContextRole.STUDENT,
    schooling_level: 'SUPERIOR',
  },
  {
    email: 'outsider@family-test.com',
    password: 'Test123!@#',
    name: 'Outsider',
    context_role: ContextRole.STUDENT,
    schooling_level: 'SUPERIOR',
  },
];

async function main() {
  console.log('🌱 Seeding E2E test users...');
  
  // Get or Create default institution
  let institution = await prisma.institutions.findFirst();
  if (!institution) {
    console.log('⚠️ No institution found. Creating default "AprendeAI Institute"...');
    institution = await prisma.institutions.create({
        data: {
            name: 'AprendeAI Institute',
            type: InstitutionType.OTHER,
            country: 'BR',
            slug: 'aprendeai-institute'
        }
    });
  }
  console.log(`Using institution: ${institution.name} (${institution.id})`);
  
  // First, ensure Plans exist (required for subscriptions during login)
  console.log('📋 Ensuring Plans exist...');
  
  const dummyEntitlements = {
    features: {
      ai_chat: true,
      content_generation: true,
    },
    limits: {
      api_calls_per_day: 100,
    }
  };

  await prisma.plans.upsert({
    where: { id: 'plan_free' },
    update: {},
    create: {
      id: 'plan_free',
      code: 'FREE',
      name: 'Free Plan',
      type: 'FREE',
      monthly_price: 0,
      yearly_price: 0,
      entitlements: dummyEntitlements,
      updated_at: new Date(),
    },
  });

  await prisma.plans.upsert({
    where: { id: 'individual_premium' },
    update: {},
    create: {
      id: 'individual_premium',
      code: 'PRO',
      name: 'Individual Premium',
      type: 'INDIVIDUAL_PREMIUM',
      monthly_price: 49.9,
      yearly_price: 499,
      entitlements: dummyEntitlements,
      updated_at: new Date(),
    },
  });

  await prisma.plans.upsert({
    where: { id: 'plan_family' },
    update: {},
    create: {
      id: 'plan_family',
      code: 'FAMILY',
      name: 'Family Plan',
      type: 'FAMILY',
      monthly_price: 79.9,
      yearly_price: 799,
      entitlements: dummyEntitlements,
      updated_at: new Date(),
    },
  });

  console.log('✅ Plans created/updated');

  // Create Users
  for (const userData of E2E_USERS) {
    // Check if user exists
    const existing = await prisma.users.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`✓ User ${userData.email} already exists`);
      continue;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        email: userData.email,
        password_hash: passwordHash,
        name: userData.name,
        last_context_role: userData.context_role,
        schooling_level: userData.schooling_level,
        last_institution_id: institution.id,
      },
    });

    console.log(`✓ Created user: ${user.email}`);
  }

  console.log('📚 Ensuring Learning Assets for E2E...');
  const contents = await prisma.contents.findMany();
  for (const content of contents) {
    const existingAsset = await prisma.learning_assets.findFirst({
      where: { content_id: content.id },
    });

    if (!existingAsset) {
      await prisma.learning_assets.create({
        data: {
          id: `asset-${content.id}`,
          content_id: content.id,
          layer: AssetLayer.L1,
          modality: SessionModality.READING,
          prompt_version: 'v1',
          updated_at: new Date(),
        },
      });
    }
  }

  console.log('✅ E2E test users seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding E2E users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
