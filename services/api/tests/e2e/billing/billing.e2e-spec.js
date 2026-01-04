"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../../src/app.module");
const prisma_service_1 = require("../../../src/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
describe("Billing (E2E)", () => {
    let app;
    let prisma;
    let jwtService;
    beforeAll(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        prisma = moduleRef.get(prisma_service_1.PrismaService);
        jwtService = moduleRef.get(jwt_1.JwtService);
        await app.init();
    }, 60000);
    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });
    const testEmail = `e2e-billing-${Date.now()}@example.com`;
    let authToken;
    it("should authenticate and return entitlements", async () => {
        const user = await prisma.users.create({
            data: {
                email: testEmail,
                name: "E2E Billing User",
                password_hash: "hashed",
                last_context_role: "STUDENT",
                schooling_level: "SUPERIOR",
                entitlement_snapshots: {
                    create: {
                        scope_type: "USER",
                        scope_id: "",
                        source: "FREE",
                        plan_type: "FREE",
                        limits: { seats: 1 },
                        features: {},
                        updated_at: new Date(),
                    },
                },
            },
        });
        authToken = jwtService.sign({ sub: user.id, email: user.email });
        const response = await request(app.getHttpServer())
            .get("/me/entitlements")
            .set("Authorization", `Bearer ${authToken}`)
            .expect(200);
        expect(response.body).toHaveProperty("source", "FREE");
        expect(response.body).toHaveProperty("planType", "FREE");
    });
});
//# sourceMappingURL=billing.e2e-spec.js.map