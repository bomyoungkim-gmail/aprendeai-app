import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../../../src/prisma/prisma.service";
import { SubscriptionService } from "../../../src/billing/subscription.service";
import { BillingModule } from "../../../src/billing/billing.module";
import { PrismaModule } from "../../../src/prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";

import { EntitlementsService } from "../../../src/billing/entitlements.service";

describe("Subscription Flow (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let subscriptionService: SubscriptionService;
  let entitlementsService: EntitlementsService;

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
    subscriptionService =
      moduleFixture.get<SubscriptionService>(SubscriptionService);
    entitlementsService =
      moduleFixture.get<EntitlementsService>(EntitlementsService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // Unique user for this test run
  const testEmail = `integration-billing-${Date.now()}@example.com`;
  let userId: string;

  it("should create a user and assign initial FREE subscription", async () => {
    // 1. Create User via Prisma (simulating Auth flow)
    const user = await prisma.users.create({
      data: {
        email: testEmail,
        name: "Billing Test User",

        last_context_role: "STUDENT",
        schooling_level: "SUPERIOR",
      },
    });
    userId = user.id;

    // 2. Call createInitialSubscription (usually called by AuthController)
    await subscriptionService.createInitialSubscription("USER", userId);

    // 3. Verify Subscription in DB
    const sub = await prisma.subscriptions.findFirst({
      where: { user_id: userId, status: "ACTIVE" },
      include: { plans: true },
    });

    expect(sub).toBeDefined();
    expect(sub?.plans.type).toBe("FREE"); // Note: FREE is modeled as FREE type now
  });

  it("should have correct entitlements snapshot", async () => {
    // Manually trigger snapshot refresh (normally done by Auth/Middleware)
    await entitlementsService.refreshSnapshot(userId);

    // Verify snapshot exists
    const snapshot = await prisma.entitlement_snapshots.findUnique({
      where: {
        user_id_scope_type_scope_id: {
          user_id: userId,
          scope_type: "USER",
          scope_id: userId,
        },
      },
    });

    expect(snapshot).toBeDefined();
    expect(snapshot?.plan_type).toBe("FREE");

    // Check limits (json field)
    const limits = snapshot?.limits as any;
    expect(limits).toBeDefined();
    // Assuming FREE_LIMITS are seeded/default
    // logic in entitlements.service checks limits
  });
});
