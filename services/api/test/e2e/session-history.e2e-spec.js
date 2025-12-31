"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const auth_helper_1 = require("../helpers/auth.helper");
describe("Session History API (E2E)", () => {
    let app;
    let prisma;
    let authHelper;
    let authToken;
    let userId;
    let contentId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const secret = process.env.JWT_SECRET || "test-secret-key-123";
        authHelper = new auth_helper_1.TestAuthHelper(secret);
        const user = await prisma.users.create({
            data: {
                email: `session_history_${Date.now()}@test.com`,
                name: "History Test User",
                password_hash: "test-hash",
                last_context_role: "STUDENT",
                schooling_level: "HIGHER_EDUCATION",
            },
        });
        userId = user.id;
        authToken = authHelper.generateAuthHeader({
            id: userId,
            email: user.email,
            name: user.name,
        });
        const content = await prisma.contents.create({
            data: {
                id: `content_hist_${Date.now()}`,
                title: "Test Article for History",
                raw_text: "Test content",
                type: "ARTICLE",
                original_language: "PT_BR",
                users_created_by: { connect: { id: userId } },
                scope_type: "USER",
                updated_at: new Date(),
            },
        });
        contentId = content.id;
        const now = new Date();
        for (let i = 0; i < 25; i++) {
            const startedAt = new Date(now);
            startedAt.setDate(startedAt.getDate() - i);
            await prisma.reading_sessions.create({
                data: {
                    user_id: userId,
                    content_id: contentId,
                    phase: i % 3 === 0 ? "PRE" : i % 3 === 1 ? "DURING" : "POST",
                    modality: "READING",
                    asset_layer: "L1",
                    goal_statement: `Session ${i}`,
                    prediction_text: "",
                    target_words_json: [],
                    started_at: startedAt,
                    finished_at: i < 20 ? new Date(startedAt.getTime() + 30 * 60000) : null,
                },
            });
        }
    });
    afterAll(async () => {
        if (userId) {
            await prisma.reading_sessions.deleteMany({ where: { user_id: userId } });
            await prisma.contents.deleteMany({ where: { created_by: userId } });
            await prisma.users.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
        await app.close();
    });
    describe("GET /api/v1/sessions", () => {
        it("should return paginated sessions with default params", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.sessions).toBeDefined();
                expect(Array.isArray(res.body.sessions)).toBe(true);
                expect(res.body.sessions.length).toBeLessThanOrEqual(20);
                expect(res.body.pagination).toMatchObject({
                    page: 1,
                    limit: 20,
                    total: 25,
                    totalPages: 2,
                });
            });
        });
        it("should respect page and limit parameters", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions?page=2&limit=10")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.sessions.length).toBeLessThanOrEqual(10);
                expect(res.body.pagination).toMatchObject({
                    page: 2,
                    limit: 10,
                });
            });
        });
        it("should filter by phase", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions?phase=PRE")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.sessions.length).toBeGreaterThan(0);
                res.body.sessions.forEach((session) => {
                    expect(session.phase).toBe("PRE");
                });
            });
        });
        it("should filter by date range", () => {
            const since = new Date();
            since.setDate(since.getDate() - 7);
            const until = new Date();
            return request(app.getHttpServer())
                .get(`/api/v1/sessions?since=${since.toISOString()}&until=${until.toISOString()}`)
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.sessions).toBeDefined();
                expect(res.body.sessions.length).toBeGreaterThan(0);
                expect(res.body.sessions.length).toBeLessThan(25);
            });
        });
        it("should search by content title", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions?query=Test Article")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.sessions).toBeDefined();
                res.body.sessions.forEach((session) => {
                    expect(session.content.title).toContain("Test Article");
                });
            });
        });
        it("should enforce max limit of 100", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions?limit=500")
                .set("Authorization", authToken)
                .expect(400);
        });
        it("should return 401 without auth token", () => {
            return request(app.getHttpServer()).get("/api/v1/sessions").expect(401);
        });
    });
    describe("GET /api/v1/sessions/export", () => {
        it("should export as JSON by default", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/export")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.data).toBeDefined();
                expect(Array.isArray(res.body.data)).toBe(true);
                expect(res.body.count).toBe(25);
            });
        });
        it("should export as CSV when format=csv", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/export?format=csv")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.data).toBeDefined();
                expect(typeof res.body.data).toBe("string");
                expect(res.body.data).toContain("ID,Started At");
                expect(res.body.filename).toMatch(/sessions_.*\.csv/);
            });
        });
        it("should return 401 without auth token", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/export")
                .expect(401);
        });
    });
    describe("GET /api/v1/sessions/analytics", () => {
        it("should return analytics with default 30 days", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/analytics")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty("activityByDate");
                expect(res.body).toHaveProperty("phaseDistribution");
                expect(res.body).toHaveProperty("totalSessions");
                expect(res.body.periodDays).toBe(30);
                expect(res.body.phaseDistribution).toMatchObject({
                    PRE: expect.any(Number),
                    DURING: expect.any(Number),
                    POST: expect.any(Number),
                });
            });
        });
        it("should respect custom days parameter", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/analytics?days=7")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(res.body.periodDays).toBe(7);
                expect(res.body.totalSessions).toBeLessThan(25);
            });
        });
        it("should return activity grouped by date", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/analytics?days=30")
                .set("Authorization", authToken)
                .expect(200)
                .expect((res) => {
                expect(typeof res.body.activityByDate).toBe("object");
                const dates = Object.keys(res.body.activityByDate);
                expect(dates.length).toBeGreaterThan(0);
                const firstDate = dates[0];
                expect(res.body.activityByDate[firstDate]).toHaveProperty("count");
                expect(res.body.activityByDate[firstDate]).toHaveProperty("minutes");
            });
        });
        it("should return 401 without auth token", () => {
            return request(app.getHttpServer())
                .get("/api/v1/sessions/analytics")
                .expect(401);
        });
    });
});
//# sourceMappingURL=session-history.e2e-spec.js.map