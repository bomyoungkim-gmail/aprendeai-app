import { ContextRole } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { TestAuthHelper } from "../helpers/auth.helper";
import { SessionTrackingService } from "../../src/analytics/session-tracking.service";

describe("Study Session Analytics (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    eventEmitter = app.get<EventEmitter2>(EventEmitter2);
    const configService = app.get<ConfigService>(ConfigService);
    const jwtSecret = configService.get<string>("JWT_SECRET");

    // Use helper for auth
    const authHelper = new TestAuthHelper(jwtSecret);

    const testUser = await prisma.users.upsert({
      where: { email: `analytics-test@test.com` },
      create: {
        name: "Analytics Test User",
        email: `analytics-test@test.com`,
        password_hash: "hashed",
        last_context_role: ContextRole.STUDENT,
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
    // Cleanup
    await prisma.study_sessions.deleteMany({ where: { user_id: userId } });
    await prisma.users.delete({ where: { id: userId } });
    await app.close();
  });

  describe("Event-Driven Session Creation", () => {
    it("should create StudySession whengagement_score:mpleted event is emitted", async () => {
      // Emit game completion event
      eventEmitter.emit("session.started", {
        user_id: userId,
        activity_type: "game",
        source_id: "test-game-session",
      });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify StudySession was created
      const sessions = await prisma.study_sessions.findMany({
        where: { user_id: userId, activity_type: "game" },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].activity_type).toBe("game");
      expect(sessions[0].source_id).toBe("test-game-session");
    });

    it("should create StudySession when reading.activity event is emitted", async () => {
      const contentId = "test-content-123";

      // Emit reading activity
      eventEmitter.emit("reading.activity", {
        user_id: userId,
        content_id: contentId,
        activity_type: "annotation",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify reading session created
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
      // Create a session first
      const session = await prisma.study_sessions.create({
        data: {
          id: "test-session-metrics",
          user_id: userId,
          activity_type: "game",
          start_time: new Date(),
        },
      });

      // Emit finish event
      eventEmitter.emit("session.finished", {
        sessionId: session.id,
        duration_minutes: 30,
        net_focus_minutes: 25,
        accuracy_rate: 85,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify metrics updated
      const updated = await prisma.study_sessions.findUnique({
        where: { id: session.id },
      });

      expect(updated.duration_minutes).toBe(30);
      expect(updated.net_focus_minutes).toBe(25);
      expect(updated.accuracy_rate).toBe(85);
      expect(updated.focus_score).toBeCloseTo(83.33, 1); // (25/30)*100
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

      // Emit blur heartbeat
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
      // Create sample sessions for analytics
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
      // Create old session (2 hours ago)
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const oldSession = await prisma.study_sessions.create({
        data: {
          id: "test-session-cleanup",
          user_id: userId,
          activity_type: "reading",
          start_time: oldTime,
        },
      });

      // Manually trigger cleanup (in real app, this would be a cron job)
      const sessionTrackingService = app.get<SessionTrackingService>(
        SessionTrackingService,
      );
      await sessionTrackingService.autoCloseAbandonedSessions(30);

      // Verify session was closed
      const closed = await prisma.study_sessions.findUnique({
        where: { id: oldSession.id },
      });

      expect(closed.end_time).toBeTruthy();
      expect(closed.duration_minutes).toBeGreaterThan(0);
    });
  });
});
