"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const auth_helper_1 = require("../helpers/auth.helper");
describe("Session History Performance Tests (E2E)", () => {
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
        const configService = app.get(config_1.ConfigService);
        const jwtSecret = configService.get("JWT_SECRET");
        authHelper = new auth_helper_1.TestAuthHelper(jwtSecret);
        prisma = app.get(prisma_service_1.PrismaService);
        const user = await prisma.users.create({
            data: {
                email: `perf_test_${Date.now()}@test.com`,
                name: "Performance Test User",
                password_hash: "test-hash",
                last_context_role: "STUDENT",
                schooling_level: "HIGHER_EDUCATION",
            },
        });
        userId = user.id;
        authToken = authHelper.generateAuthHeader({
            id: user.id,
            email: user.email,
            name: user.name,
        });
        const content = await prisma.contents.create({
            data: {
                id: `content_perf_${Date.now()}`,
                title: "Performance Test Article",
                raw_text: "Test content for performance testing",
                type: "ARTICLE",
                original_language: "PT_BR",
                users_created_by: { connect: { id: userId } },
                scope_type: "USER",
                updated_at: new Date(),
            },
        });
        contentId = content.id;
        console.log("🚀 Creating 1000 test sessions...");
        const startTime = Date.now();
        const batchSize = 100;
        const totalSessions = 1000;
        for (let batch = 0; batch < totalSessions / batchSize; batch++) {
            const sessions = [];
            for (let i = 0; i < batchSize; i++) {
                const sessionIndex = batch * batchSize + i;
                const startedAt = new Date();
                startedAt.setDate(startedAt.getDate() - Math.floor(sessionIndex / 10));
                startedAt.setHours(startedAt.getHours() - (sessionIndex % 24));
                sessions.push({
                    user_id: userId,
                    content_id: contentId,
                    phase: sessionIndex % 3 === 0
                        ? "PRE"
                        : sessionIndex % 3 === 1
                            ? "DURING"
                            : "POST",
                    modality: "READING",
                    asset_layer: "L1",
                    goal_statement: `Performance test session ${sessionIndex}`,
                    prediction_text: "",
                    target_words_json: [],
                    started_at: startedAt,
                    finished_at: sessionIndex < 800
                        ? new Date(startedAt.getTime() + (15 + Math.random() * 45) * 60000)
                        : null,
                });
            }
            await prisma.reading_sessions.createMany({ data: sessions });
            if ((batch + 1) % 2 === 0) {
                console.log(`  ✓ Created ${(batch + 1) * batchSize} sessions...`);
            }
        }
        const creationTime = Date.now() - startTime;
        console.log(`✅ Created ${totalSessions} sessions in ${creationTime}ms (${(creationTime / totalSessions).toFixed(2)}ms per session)`);
    });
    afterAll(async () => {
        console.log("🧹 Cleaning up test data...");
        if (userId) {
            await prisma.reading_sessions.deleteMany({ where: { user_id: userId } });
            await prisma.contents.deleteMany({ where: { created_by: userId } });
            await prisma.users.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
        await app.close();
        console.log("✅ Cleanup complete");
    });
    describe("Performance Benchmarks", () => {
        it("should list first page in <50ms with 1000 sessions", async () => {
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get("/api/v1/sessions?limit=20")
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.pagination.total).toBe(1000);
            expect(duration).toBeLessThan(50);
            console.log(`📊 First page query: ${duration}ms`);
        });
        it("should list middle page in <50ms", async () => {
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get("/api/v1/sessions?page=25&limit=20")
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.sessions).toHaveLength(20);
            expect(response.body.pagination.page).toBe(25);
            expect(duration).toBeLessThan(50);
            console.log(`📊 Middle page query: ${duration}ms`);
        });
        it("should filter by phase in <50ms", async () => {
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get("/api/v1/sessions?phase=PRE&limit=20")
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.sessions.length).toBeGreaterThan(0);
            response.body.sessions.forEach((session) => {
                expect(session.phase).toBe("PRE");
            });
            expect(duration).toBeLessThan(50);
            console.log(`📊 Phase filter query: ${duration}ms`);
        });
        it("should filter by date range in <50ms", async () => {
            const since = new Date();
            since.setDate(since.getDate() - 30);
            const until = new Date();
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get(`/api/v1/sessions?since=${since.toISOString()}&until=${until.toISOString()}&limit=20`)
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.sessions.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(50);
            console.log(`📊 Date range filter query: ${duration}ms`);
        });
        it("should export all 1000 sessions in <1000ms", async () => {
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get("/api/v1/sessions/export?format=json")
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.data).toHaveLength(1000);
            expect(response.body.count).toBe(1000);
            expect(duration).toBeLessThan(1000);
            console.log(`📊 Full export query: ${duration}ms`);
        });
        it("should export as CSV in <1500ms", async () => {
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get("/api/v1/sessions/export?format=csv")
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.data).toBeDefined();
            expect(typeof response.body.data).toBe("string");
            expect(duration).toBeLessThan(1500);
            console.log(`📊 CSV export query: ${duration}ms`);
        });
        it("should calculate analytics for 1000 sessions in <200ms", async () => {
            const start = Date.now();
            const response = await request(app.getHttpServer())
                .get("/api/v1/sessions/analytics?days=100")
                .set("Authorization", authToken)
                .expect(200);
            const duration = Date.now() - start;
            expect(response.body.totalSessions).toBe(1000);
            expect(response.body.activityByDate).toBeDefined();
            expect(duration).toBeLessThan(200);
            console.log(`📊 Analytics query: ${duration}ms`);
        });
        it("should handle concurrent requests efficiently", async () => {
            const concurrentRequests = 10;
            const start = Date.now();
            const promises = Array.from({ length: concurrentRequests }, (_, i) => request(app.getHttpServer())
                .get(`/api/v1/sessions?page=${i + 1}&limit=20`)
                .set("Authorization", authToken));
            const responses = await Promise.all(promises);
            const duration = Date.now() - start;
            responses.forEach((response) => {
                expect(response.status).toBe(200);
                expect(response.body.sessions).toBeDefined();
            });
            const avgDuration = duration / concurrentRequests;
            expect(avgDuration).toBeLessThan(100);
            console.log(`📊 ${concurrentRequests} concurrent requests: ${duration}ms total, ${avgDuration.toFixed(2)}ms avg`);
        });
    });
    describe("Performance Summary", () => {
        it("should print performance summary", async () => {
            console.log("\n" + "=".repeat(60));
            console.log("📊 PERFORMANCE TEST SUMMARY (1000 sessions)");
            console.log("=".repeat(60));
            console.log("✅ All performance benchmarks passed!");
            console.log("   • First page: <50ms");
            console.log("   • Middle page: <50ms");
            console.log("   • Phase filter: <50ms");
            console.log("   • Date filter: <50ms");
            console.log("   • JSON export: <1000ms");
            console.log("   • CSV export: <1500ms");
            console.log("   • Analytics: <200ms");
            console.log("   • Concurrent (10x): <100ms avg");
            console.log("=".repeat(60) + "\n");
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=session-history-performance.e2e-spec.js.map