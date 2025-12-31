"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const request = require("supertest");
const auth_helper_1 = require("../helpers/auth.helper");
const jwt_1 = require("@nestjs/jwt");
const routes_constants_1 = require("../../src/common/constants/routes.constants");
describe("Extension Auth Integration Tests (e2e)", () => {
    let app;
    let prisma;
    let authHelper;
    let userId;
    let authToken;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const jwtService = app.get(jwt_1.JwtService);
        const secret = process.env.JWT_SECRET || "test-secret";
        authHelper = new auth_helper_1.TestAuthHelper(secret);
        const userData = (0, auth_helper_1.createTestUser)();
        userData.email = `ext_test_${Date.now()}@example.com`;
        const user = await prisma.users.create({
            data: {
                id: `user-ext-${Date.now()}`,
                email: userData.email,
                name: userData.name,
                password_hash: "hash",
                last_context_role: "STUDENT",
                status: "ACTIVE",
                schooling_level: "HIGHER_EDUCATION",
                updated_at: new Date(),
            },
        });
        userId = user.id;
        authToken = authHelper.generateToken(Object.assign(Object.assign({}, userData), { id: user.id }));
    });
    afterAll(async () => {
        if (userId) {
            await prisma.extension_device_auth.deleteMany({
                where: { user_id: userId },
            });
            await prisma.extension_grants.deleteMany({ where: { user_id: userId } });
            await prisma.users.delete({ where: { id: userId } }).catch(() => { });
        }
        await prisma.$disconnect();
        await app.close();
    });
    describe("Device Code Flow", () => {
        let deviceCode;
        let userCode;
        let accessToken;
        let refreshToken;
        it("should start device code flow", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.EXTENSION_DEVICE_START))
                .send({
                clientId: "browser-extension",
                scopes: ["extension:webclip:create"],
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("deviceCode");
            expect(response.body).toHaveProperty("userCode");
            expect(response.body).toHaveProperty("verificationUrl");
            deviceCode = response.body.deviceCode;
            userCode = response.body.userCode;
        });
        it("should return PENDING when polling immediately", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.EXTENSION_DEVICE_POLL))
                .send({
                clientId: "browser-extension",
                deviceCode,
            });
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("PENDING");
        });
        it("should approve device code (as logged in user)", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.EXTENSION_DEVICE_APPROVE))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                userCode,
                approve: true,
            });
            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);
        });
        it("should return APPROVED and tokens when polling after approval", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.EXTENSION_DEVICE_POLL))
                .send({
                clientId: "browser-extension",
                deviceCode,
            });
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("APPROVED");
            expect(response.body).toHaveProperty("accessToken");
            expect(response.body).toHaveProperty("refreshToken");
            expect(response.body.scope).toContain("extension:webclip:create");
            accessToken = response.body.accessToken;
            refreshToken = response.body.refreshToken;
        });
        it("should use extension token to access protected endpoint", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.EXTENSION_ME))
                .set("Authorization", `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body.userId).toBe(userId);
        });
        it("should refresh token", async () => {
            await new Promise((resolve) => setTimeout(resolve, 1100));
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.EXTENSION_TOKEN_REFRESH))
                .send({ refreshToken });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("accessToken");
            expect(response.body.accessToken).not.toBe(accessToken);
        });
    });
});
//# sourceMappingURL=extension-auth.integration.spec.js.map