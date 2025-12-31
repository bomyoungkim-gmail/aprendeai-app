"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const auth_helper_1 = require("../helpers/auth.helper");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
describe("Admin Feature Flags (Integration)", () => {
    let app;
    let prisma;
    let authToken;
    let adminUserId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const configService = app.get(config_1.ConfigService);
        const jwtSecret = configService.get("JWT_SECRET");
        const authHelper = new auth_helper_1.TestAuthHelper(jwtSecret);
        const adminUser = await prisma.users.upsert({
            where: { email: "admin-integration@test.com" },
            create: {
                name: "Admin Integration",
                email: "admin-integration@test.com",
                password_hash: "hashed",
                system_role: client_1.SystemRole.ADMIN,
                last_context_role: client_1.ContextRole.OWNER,
            },
            update: { system_role: client_1.SystemRole.ADMIN }
        });
        adminUserId = adminUser.id;
        authToken = authHelper.generateToken({
            id: adminUserId,
            email: adminUser.email,
            name: adminUser.name,
        });
    });
    afterAll(async () => {
        await prisma.feature_flags.deleteMany({ where: { created_by: adminUserId } });
        await prisma.users.delete({ where: { id: adminUserId } });
        await app.close();
    });
    it("POST /admin/feature-flags should create a new flag", async () => {
        const flagData = {
            key: "integration-test-flag",
            name: "Integration Test Flag",
            description: "Created by integration test",
            enabled: true,
            environment: "DEVELOPMENT",
            scopeType: "GLOBAL"
        };
        const res = await request(app.getHttpServer())
            .post("/admin/feature-flags")
            .set("Authorization", `Bearer ${authToken}`)
            .send(flagData)
            .expect(201);
        expect(res.body.key).toBe(flagData.key);
        expect(res.body.id).toBeDefined();
        const dbFlag = await prisma.feature_flags.findUnique({ where: { key: flagData.key } });
        expect(dbFlag).toBeDefined();
        expect(dbFlag.enabled).toBe(true);
    });
    it("GET /admin/feature-flags should list flags", async () => {
        const res = await request(app.getHttpServer())
            .get("/admin/feature-flags")
            .set("Authorization", `Bearer ${authToken}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        const createdFlag = res.body.find((f) => f.key === "integration-test-flag");
        expect(createdFlag).toBeDefined();
    });
});
//# sourceMappingURL=admin-feature-flags.integration.spec.js.map