"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../../src/prisma/prisma.service");
const subscription_service_1 = require("../../../src/billing/subscription.service");
const billing_module_1 = require("../../../src/billing/billing.module");
const prisma_module_1 = require("../../../src/prisma/prisma.module");
const config_1 = require("@nestjs/config");
const entitlements_service_1 = require("../../../src/billing/entitlements.service");
describe("Subscription Flow (Integration)", () => {
    let app;
    let prisma;
    let subscriptionService;
    let entitlementsService;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({ isGlobal: true }),
                prisma_module_1.PrismaModule,
                billing_module_1.BillingModule,
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        subscriptionService =
            moduleFixture.get(subscription_service_1.SubscriptionService);
        entitlementsService =
            moduleFixture.get(entitlements_service_1.EntitlementsService);
        await app.init();
    });
    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });
    const testEmail = `integration-billing-${Date.now()}@example.com`;
    let userId;
    it("should create a user and assign initial FREE subscription", async () => {
        const user = await prisma.users.create({
            data: {
                email: testEmail,
                name: "Billing Test User",
                password_hash: "hashed",
                last_context_role: "STUDENT",
                schooling_level: "SUPERIOR",
            },
        });
        userId = user.id;
        await subscriptionService.createInitialSubscription("USER", userId);
        const sub = await prisma.subscriptions.findFirst({
            where: { user_id: userId, status: "ACTIVE" },
            include: { plans: true },
        });
        expect(sub).toBeDefined();
        expect(sub === null || sub === void 0 ? void 0 : sub.plans.type).toBe("FREE");
    });
    it("should have correct entitlements snapshot", async () => {
        await entitlementsService.refreshSnapshot(userId);
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
        expect(snapshot === null || snapshot === void 0 ? void 0 : snapshot.plan_type).toBe("FREE");
        const limits = snapshot === null || snapshot === void 0 ? void 0 : snapshot.limits;
        expect(limits).toBeDefined();
    });
});
//# sourceMappingURL=subscription-flow.spec.js.map