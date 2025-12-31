"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const request = require("supertest");
const auth_helper_1 = require("../helpers/auth.helper");
describe("Family Mode Integration Tests (e2e)", () => {
    let app;
    let prisma;
    let authHelper;
    let authToken;
    let userId;
    let familyId;
    let learnerId;
    let policyId;
    let readingSessionId;
    let teachBackReadingSessionId;
    let contentId;
    let coSessionId;
    let teachBackSessionId;
    beforeAll(async () => {
        process.env.JWT_SECRET = "family-test-secret";
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const configService = app.get(config_1.ConfigService);
        const secret = configService.get("JWT_SECRET");
        authHelper = new auth_helper_1.TestAuthHelper(secret);
        const educatorData = (0, auth_helper_1.createTestUser)();
        educatorData.email = `educator_fam_${Date.now()}@example.com`;
        const educator = await prisma.users.create({
            data: {
                email: educatorData.email,
                name: educatorData.name,
                schooling_level: "HIGHER_EDUCATION",
            },
        });
        userId = educator.id;
        authToken = authHelper.generateAuthHeader(Object.assign(Object.assign({}, educatorData), { id: educator.id }));
        const learnerData = (0, auth_helper_1.createTestUser)();
        learnerData.email = `learner_fam_${Date.now()}@example.com`;
        const learner = await prisma.users.create({
            data: {
                email: learnerData.email,
                name: "Learner Child",
                schooling_level: "K12_LOWER",
            },
        });
        learnerId = learner.id;
        const family = await prisma.families.create({
            data: {
                name: "Test Family",
                owner_user_id: educator.id,
            },
        });
        familyId = family.id;
        const content = await prisma.contents.create({
            data: {
                id: `content-${Date.now()}`,
                title: "Test Content",
                type: "ARTICLE",
                raw_text: "Some text content",
                original_language: "EN",
                created_by: educator.id,
            },
        });
        contentId = content.id;
        const rs = await prisma.reading_sessions.create({
            data: {
                id: `rs-${Date.now()}`,
                user_id: learnerId,
                content_id: content.id,
                phase: "PRE",
                modality: "READING",
            },
        });
        readingSessionId = rs.id;
        const rs2 = await prisma.reading_sessions.create({
            data: {
                id: `rs2-${Date.now()}`,
                user_id: learnerId,
                content_id: content.id,
                phase: "FINISHED",
                modality: "READING",
            },
        });
        teachBackReadingSessionId = rs2.id;
    });
    afterAll(async () => {
        if (readingSessionId)
            await prisma.reading_sessions.deleteMany({
                where: { id: readingSessionId },
            });
        if (teachBackReadingSessionId)
            await prisma.reading_sessions.deleteMany({
                where: { id: teachBackReadingSessionId },
            });
        if (contentId)
            await prisma.contents.deleteMany({ where: { id: contentId } });
        if (familyId)
            await prisma.families.deleteMany({ where: { id: familyId } });
        if (userId)
            await prisma.users.deleteMany({ where: { id: userId } });
        if (learnerId)
            await prisma.users.deleteMany({ where: { id: learnerId } });
        await prisma.$disconnect();
        await app.close();
    });
    describe("Family Policy Flow", () => {
        it("should create a family policy", async () => {
            const response = await request(app.getHttpServer())
                .post("/api/v1/families/policy")
                .set("Authorization", authToken)
                .send({
                family_id: familyId,
                learner_user_id: learnerId,
                timebox_default_min: 20,
                co_reading_days: [1, 3, 5],
                privacy_mode: "AGGREGATED_ONLY",
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.timebox_default_min).toBe(20);
            policyId = response.body.id;
        });
        it("should get policy confirmation prompt", async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/v1/families/policy/${policyId}/prompt`)
                .set("Authorization", authToken);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("nextPrompt");
            expect(response.body.nextPrompt).toContain("20 min");
        });
        it("should get educator dashboard with privacy filtering", async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/families/${familyId}/educator-dashboard/${learnerId}`)
                .set("Authorization", authToken);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("streakDays");
            expect(response.body).toHaveProperty("minutesTotal");
            expect(response.body).toHaveProperty("comprehensionAvg");
            expect(response.body.topBlockers).toBeUndefined();
        });
    });
    describe("Co-Reading Session Flow", () => {
        it("should start co-reading session", async () => {
            const response = await request(app.getHttpServer())
                .post("/api/v1/families/co-sessions/start")
                .set("Authorization", authToken)
                .send({
                familyId: familyId,
                learnerUserId: learnerId,
                educatorUserId: userId,
                readingSessionId: readingSessionId,
                contentId: contentId,
                timeboxMin: 20,
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("coSession");
            expect(response.body).toHaveProperty("context");
            expect(response.body.context.currentPhase).toBe("BOOT");
            coSessionId = response.body.coSession.id;
        });
        it("should get co-session prompt by phase", async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/v1/families/co-sessions/${coSessionId}/prompt`)
                .set("Authorization", authToken)
                .send({ phase: "PRE" });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("nextPrompt");
        });
    });
    describe("Teach-Back Session Flow", () => {
        it("should start teach-back session", async () => {
            const response = await request(app.getHttpServer())
                .post("/api/v1/families/teachback/start")
                .set("Authorization", authToken)
                .send({
                familyId: familyId,
                childUserId: learnerId,
                parentUserId: userId,
                baseReadingSessionId: teachBackReadingSessionId,
                durationMin: 7,
            });
            if (response.status !== 201) {
                console.log("DEBUG: Start Teach-Back Failed:", JSON.stringify(response.body, null, 2));
            }
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("session");
            expect(response.body.session.type).toBe("TEACH_BACK");
            teachBackSessionId = response.body.session.id;
        });
        it("should get teach-back prompts by step", async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/v1/families/teachback/${teachBackSessionId}/prompt`)
                .set("Authorization", authToken)
                .send({ step: 2 });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("nextPrompt");
        });
        it("should finish teach-back with stars", async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/v1/families/teachback/${teachBackSessionId}/finish`)
                .set("Authorization", authToken)
                .send({ stars: 3 });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("nextPrompt");
            expect(response.body.nextPrompt).toContain("3 estrelas");
        });
    });
});
//# sourceMappingURL=family-mode.integration.spec.js.map