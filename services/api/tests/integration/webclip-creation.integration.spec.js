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
const uuid_1 = require("uuid");
describe("WebClip Creation Integration Tests", () => {
    let app;
    let prisma;
    let authHelper;
    let userId;
    let extensionToken;
    let userToken;
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
        userData.email = `webclip_test_${Date.now()}@example.com`;
        const user = await prisma.users.create({
            data: {
                id: (0, uuid_1.v4)(),
                email: userData.email,
                name: userData.name,
                password_hash: "hash",
                status: "ACTIVE",
                schooling_level: "HIGHER_EDUCATION",
                updated_at: new Date(),
            },
        });
        userId = user.id;
        userToken = authHelper.generateToken(Object.assign(Object.assign({}, userData), { id: user.id }));
        const localJwtService = new jwt_1.JwtService({ secret });
        extensionToken = localJwtService.sign({
            sub: userId,
            email: userData.email,
            role: "COMMON_USER",
            scopes: ["extension:webclip:create", "extension:session:start"],
            clientId: "browser-extension",
        });
    });
    afterAll(async () => {
        if (userId) {
            await prisma.reading_sessions.deleteMany({ where: { user_id: userId } });
            const contents = await prisma.contents.findMany({
                where: { owner_user_id: userId },
                select: { id: true },
            });
            const contentIds = contents.map((c) => c.id);
            if (contentIds.length > 0) {
                await prisma.content_versions.deleteMany({
                    where: { content_id: { in: contentIds } },
                });
                await prisma.user_library_items.deleteMany({
                    where: { content_id: { in: contentIds } },
                });
            }
            await prisma.contents.deleteMany({ where: { owner_user_id: userId } });
            await prisma.users.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
        await app.close();
    });
    describe("WebClip Creation", () => {
        it("should create WebClip with valid extension token", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.WEBCLIP.CREATE))
                .set("Authorization", `Bearer ${extensionToken}`)
                .send({
                sourceUrl: "https://example.com/article",
                title: "Test Article",
                siteDomain: "example.com",
                captureMode: "READABILITY",
                contentText: "Full article content here...",
                selectionText: "Only selected text",
                languageHint: "PT_BR",
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("content_id");
            const contentId = response.body.content_id;
            const verifyResponse = await request(app.getHttpServer())
                .get((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.WEBCLIP.BASE + "/" + contentId))
                .set("Authorization", `Bearer ${userToken}`);
            expect(verifyResponse.status).toBe(200);
            expect(verifyResponse.body.type).toBe("WEB_CLIP");
            expect(verifyResponse.body.metadata.source_url).toBe("https://example.com/article");
        });
        it("should reject creation without required scope", async () => {
            const secret = process.env.JWT_SECRET || "test-secret";
            const localJwtService = new jwt_1.JwtService({ secret });
            const weakToken = localJwtService.sign({
                sub: userId,
                email: "test@example.com",
                role: "COMMON_USER",
                scopes: ["extension:session:start"],
            });
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.WEBCLIP.CREATE))
                .set("Authorization", `Bearer ${weakToken}`)
                .send({
                sourceUrl: "https://example.com",
                title: "Fail",
                siteDomain: "example.com",
                captureMode: "SELECTION",
            });
            expect(response.status).toBe(403);
        });
    });
    describe("Session Start", () => {
        let contentId;
        beforeAll(async () => {
            const content = await prisma.contents.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    type: "WEB_CLIP",
                    title: "Session Content",
                    users_owner: { connect: { id: userId } },
                    users_created_by: { connect: { id: userId } },
                    scope_type: "USER",
                    original_language: "PT_BR",
                    raw_text: "Test content for session",
                    updated_at: new Date(),
                },
            });
            contentId = content.id;
        });
        it("should start session with valid extension token", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.WEBCLIP.START_SESSION(contentId)))
                .set("Authorization", `Bearer ${extensionToken}`)
                .send({
                timeboxMin: 15,
                readingIntent: "inspectional",
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("session_id");
            const prompt = response.body.next_prompt || response.body.initial_prompt;
            expect(prompt).toBeTruthy();
            expect(typeof prompt).toBe("string");
        });
    });
});
//# sourceMappingURL=webclip-creation.integration.spec.js.map