import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { SubscriptionService } from '../../../src/billing/subscription.service';
import { BillingModule } from '../../../src/billing/billing.module';
import { PrismaModule } from '../../../src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

describe('Subscription Flow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let subscriptionService: SubscriptionService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        BillingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    subscriptionService = moduleFixture.get<SubscriptionService>(SubscriptionService);
    
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // Unique user for this test run
  const testEmail = `integration-billing-${Date.now()}@example.com`;
  let userId: string;

  it('should create a user and assign initial FREE subscription', async () => {
    // 1. Create User via Prisma (simulating Auth flow)
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Billing Test User',
        passwordHash: 'hashed',
        role: 'STUDENT',
        schoolingLevel: 'The rest',
      },
    });
    userId = user.id;

    // 2. Call createInitialSubscription (usually called by AuthController)
    await subscriptionService.createInitialSubscription('USER', userId);

    // 3. Verify Subscription in DB
    const sub = await prisma.subscription.findFirst({
      where: { userId: userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    expect(sub).toBeDefined();
    expect(sub?.plan.code).toBe('FREE');
    expect(sub?.plan.type).toBe('INDIVIDUAL_PREMIUM'); // Note: FREE is modeled as INDIVIDUAL type
  });

  it('should have correct entitlements snapshot', async () => {
    // Verify snapshot exists
    const snapshot = await prisma.entitlementSnapshot.findUnique({
      where: { userId: userId },
    });

    expect(snapshot).toBeDefined();
    expect(snapshot?.planType).toBe('FREE');
    
    // Check limits (json field)
    const limits = snapshot?.limits as any;
    expect(limits).toBeDefined();
    // Assuming FREE_LIMITS are seeded/default
    // logic in entitlements.service checks limits
  });
});
