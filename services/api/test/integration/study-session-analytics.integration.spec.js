"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const auth_helper_1 = require("../helpers/auth.helper");
const session_tracking_service_1 = require("../../src/analytics/session-tracking.service");
describe("Study Session Analytics (Integration)", () => {
    let app;
    let prisma;
    let eventEmitter;
    let authToken;
    let userId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        eventEmitter = app.get(event_emitter_1.EventEmitter2);
        const configService = app.get(config_1.ConfigService);
        const jwtSecret = configService.get("JWT_SECRET");
        const authHelper = new auth_helper_1.TestAuthHelper(jwtSecret);
        const testUser = await prisma.users.upsert({
            where: { email: `analytics-test@test.com` },
            create: {
                name: "Analytics Test User",
                email: `analytics-test@test.com`,
                password_hash: "hashed",
                last_context_role: client_1.ContextRole.STUDENT,
                schooling_level: "HIGH_SCHOOL",
            },
            update: {},
        });
        userId = testUser.id;
        authToken = authHelper.generateToken({
            id: userId,
            email: testUser.email,
            name: testUser.name,
        });
    });
    afterAll(async () => {
        await prisma.study_sessions.deleteMany({ where: { user_id: userId } });
        await prisma.users.delete({ where: { id: userId } });
        await app.close();
    });
    describe("Event-Driven Session Creation", () => {
        it("should create StudySession whengagement_score:mpleted event is emitted", async () => {
            eventEmitter.emit("session.started", {
                user_id: userId,
                activity_type: "game",
                source_id: "test-game-session",
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
            const sessions = await prisma.study_sessions.findMany({
                where: { user_id: userId, activity_type: "game" },
            });
            expect(sessions.length).toBeGreaterThan(0);
            expect(sessions[0].activity_type).toBe("game");
            expect(sessions[0].source_id).toBe("test-game-session");
        });
        it("should create StudySession when reading.activity event is emitted", async () => {
            const contentId = "test-content-123";
            eventEmitter.emit("reading.activity", {
                user_id: userId,
                content_id: contentId,
                activity_type: "annotation",
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
            const sessions = await prisma.study_sessions.findMany({
                where: {
                    user_id: userId,
                    content_id: contentId,
                    activity_type: "reading",
                },
            });
            expect(sessions.length).toBeGreaterThan(0);
            expect(sessions[0].content_id).toBe(contentId);
        });
        it("should update session with metrics on session.finished", async () => {
            const session = await prisma.study_sessions.create({
                data: {
                    id: "test-session-metrics",
                    user_id: userId,
                    activity_type: "game",
                    start_time: new Date(),
                },
            });
            eventEmitter.emit("session.finished", {
                sessionId: session.id,
                duration_minutes: 30,
                net_focus_minutes: 25,
                accuracy_rate: 85,
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
            const updated = await prisma.study_sessions.findUnique({
                where: { id: session.id },
            });
            expect(updated.duration_minutes).toBe(30);
            expect(updated.net_focus_minutes).toBe(25);
            expect(updated.accuracy_rate).toBe(85);
            expect(updated.focus_score).toBeCloseTo(83.33, 1);
            expect(updated.end_time).toBeTruthy();
        });
        it("should increment interruptions on session.heartbeat with blurred status", async () => {
            const session = await prisma.study_sessions.create({
                data: {
                    id: "test-session-heartbeat",
                    user_id: userId,
                    activity_type: "reading",
                    start_time: new Date(),
                },
            });
            eventEmitter.emit("session.heartbeat", {
                sessionId: session.id,
                status: "blurred",
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
            const updated = await prisma.study_sessions.findUnique({
                where: { id: session.id },
            });
            expect(updated.interruptions).toBeGreaterThan(0);
        });
    });
    describe("Analytics Endpoints", () => {
        beforeEach(async () => {
            const now = new Date();
            await prisma.study_sessions.createMany({
                data: [
                    {
                        id: "analytics-session-1",
                        user_id: userId,
                        activity_type: "game",
                        start_time: new Date(now.setHours(14, 0, 0, 0)),
                        end_time: new Date(now.setHours(14, 30, 0, 0)),
                        duration_minutes: 30,
                        net_focus_minutes: 25,
                        focus_score: 83,
                        accuracy_rate: 90,
                    },
                    {
                        id: "analytics-session-2",
                        user_id: userId,
                        activity_type: "reading",
                        start_time: new Date(now.setHours(15, 0, 0, 0)),
                        end_time: new Date(now.setHours(15, 45, 0, 0)),
                        duration_minutes: 45,
                        net_focus_minutes: 40,
                        focus_score: 89,
                        accuracy_rate: 75,
                    },
                ],
            });
        });
        it("GET /analytics/hourly-performance should return hourly breakdown", async () => {
            const res = await request(app.getHttpServer())
                .get("/analytics/hourly-performance?days=30")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(res.body).toHaveProperty("hourlyBreakdown");
            expect(res.body).toHaveProperty("peakHours");
            expect(res.body.daysAnalyzed).toBe(30);
            expect(Array.isArray(res.body.hourlyBreakdown)).toBe(true);
        });
        it("GET /analytics/quality-overview should return aggregated metrics", async () => {
            const res = await request(app.getHttpServer())
                .get("/analytics/quality-overview?period=week")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(res.body.totalSessions).toBeGreaterThan(0);
            expect(res.body.avgAccuracy).toBeGreaterThan(0);
            expect(res.body.avgFocusScore).toBeGreaterThan(0);
        });
    });
    describe("Auto-Close Abandoned Sessions", () => {
        it("should close sessions older than threshold", async () => {
            const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const oldSession = await prisma.study_sessions.create({
                data: {
                    id: "test-session-cleanup",
                    user_id: userId,
                    activity_type: "reading",
                    start_time: oldTime,
                },
            });
            const sessionTrackingService = app.get(session_tracking_service_1.SessionTrackingService);
            await sessionTrackingService.autoCloseAbandonedSessions(30);
            const closed = await prisma.study_sessions.findUnique({
                where: { id: oldSession.id },
            });
            expect(closed.end_time).toBeTruthy();
            expect(closed.duration_minutes).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=study-session-analytics.integration.spec.js.map