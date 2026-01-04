"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const request = require("supertest");
const auth_helper_1 = require("../helpers/auth.helper");
const jwt_1 = require("@nestjs/jwt");
describe("Extension E2E Journey", () => {
    let app;
    let prisma;
    let authHelper;
    let userId;
    let userToken;
    let extensionToken;
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
        userData.email = `e2e_ext_${Date.now()}@example.com`;
        const user = await prisma.users.create({
            data: {
                id: `user-e2e-ext-${Date.now()}`,
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
        userToken = authHelper.generateToken(Object.assign(Object.assign({}, userData), { id: user.id }));
    });
    afterAll(async () => {
        if (userId) {
            await prisma.extension_device_auth.deleteMany({
                where: { user_id: userId },
            });
            await prisma.extension_grants.deleteMany({ where: { user_id: userId } });
            await prisma.reading_sessions.deleteMany({ where: { user_id: userId } });
            const userContent = await prisma.contents.findMany({
                where: { created_by: userId },
                select: { id: true },
            });
            const contentIds = userContent.map((c) => c.id);
            await prisma.content_versions.deleteMany({
                where: { content_id: { in: contentIds } },
            });
            await prisma.contents.deleteMany({ where: { created_by: userId } });
            await prisma.users.delete({ where: { id: userId } }).catch(() => { });
        }
        await prisma.$disconnect();
        await app.close();
    });
    it("Example Journey: Connect -> Capture -> Session", async () => {
        const startRes = await request(app.getHttpServer())
            .post("/api/v1/auth/extension/device/start")
            .send({
            clientId: "browser-extension",
            scopes: ["extension:webclip:create", "extension:session:start"],
        });
        const { deviceCode, userCode } = startRes.body;
        expect(deviceCode).toBeDefined();
        await request(app.getHttpServer())
            .post("/api/v1/auth/extension/device/approve")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ userCode, approve: true })
            .expect(201);
        const pollRes = await request(app.getHttpServer())
            .post("/api/v1/auth/extension/device/poll")
            .send({ clientId: "browser-extension", deviceCode })
            .expect(201);
        expect(pollRes.body.status).toBe("APPROVED");
        extensionToken = pollRes.body.accessToken;
        expect(extensionToken).toBeDefined();
        const clipRes = await request(app.getHttpServer())
            .post("/api/v1/webclips")
            .set("Authorization", `Bearer ${extensionToken}`)
            .send({
            sourceUrl: "https://en.wikipedia.org/wiki/Artificial_intelligence",
            title: "Artificial Intelligence - Wikipedia",
            siteDomain: "wikipedia.org",
            captureMode: "READABILITY",
            contentText: "Artificial intelligence (AI) is intelligence demonstrated by machines...",
        })
            .expect(201);
        const contentId = clipRes.body.contentId;
        expect(contentId).toBeDefined();
        const sessionRes = await request(app.getHttpServer())
            .post(`/api/v1/webclips/${contentId}/sessions/start`)
            .set("Authorization", `Bearer ${extensionToken}`)
            .send({
            timeboxMin: 20,
            readingIntent: "analytical",
            goal: "Study history of AI",
        })
            .expect(201);
        const sessionId = sessionRes.body.sessionId;
        expect(sessionId).toBeDefined();
        const createdSession = await prisma.reading_sessions.findUnique({
            where: { id: sessionId },
            include: { contents: true },
        });
        expect(createdSession).toBeDefined();
        expect(createdSession.user_id).toBe(userId);
        expect(createdSession.content_id).toBe(contentId);
        expect(createdSession.phase).toBe("PRE");
    });
});
//# sourceMappingURL=extension-webclip.e2e-spec.js.map