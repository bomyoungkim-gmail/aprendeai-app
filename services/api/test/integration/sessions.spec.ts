/**
 * Integration Tests - Session Flow
 *
 * Tests complete session lifecycle using mocked Prisma to align with snake_case schema.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ReadingSessionsService } from "../../src/sessions/reading-sessions.service";
import { ProfileService } from "../../src/profiles/profile.service";
import { GamificationService } from "../../src/gamification/gamification.service";
import { VocabService } from "../../src/vocab/vocab.service";
import { OutcomesService } from "../../src/outcomes/outcomes.service";
import { GatingService } from "../../src/gating/gating.service";
import { QuickCommandParser } from "../../src/sessions/parsers/quick-command.parser";
import { ActivityService } from "../../src/activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AiServiceClient } from "../../src/ai-service/ai-service.client";
import { ProviderUsageService } from "../../src/observability/provider-usage.service";
import { ReadingSessionsController } from "../../src/sessions/reading-sessions.controller";
import { AuthGuard } from "@nestjs/passport";

describe("Sessions Integration Tests (Mocked DB)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUserId = "test-user-123";
  const testContentId = "test-content-456";

  const mockPrismaService = {
    reading_sessions: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    contents: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cornell_notes: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session_events: {
      create: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
    learner_profiles: {
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReadingSessionsController],
      providers: [
        ReadingSessionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ProfileService,
          useValue: {
            get: jest
              .fn()
              .mockResolvedValue({ education_level: "ADULTO_LEIGO" }),
            getOrCreate: jest
              .fn()
              .mockResolvedValue({ education_level: "ADULTO_LEIGO" }),
          },
        },
        { provide: GamificationService, useValue: {} },
        { provide: VocabService, useValue: {} },
        { provide: OutcomesService, useValue: {} },
        {
          provide: GatingService,
          useValue: { determineLayer: jest.fn().mockResolvedValue("L1") },
        },
        {
          provide: QuickCommandParser,
          useValue: { parse: jest.fn().mockReturnValue([]) },
        },
        { provide: AiServiceClient, useValue: {} },
        { provide: ProviderUsageService, useValue: {} },
        { provide: ActivityService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard("jwt"))
      .useValue({
        canActivate: (ctx) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { id: testUserId };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    // Enable validation pipe
    const { ValidationPipe } = await import("@nestjs/common");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /contents/:id/sessions - Create Session", () => {
    it("should create a new reading session", async () => {
      const mockSession = {
        id: "new-session-id",
        user_id: testUserId,
        content_id: testContentId,
        phase: "PRE",
        contents: { id: testContentId, title: "Test Content", type: "PDF" },
      };

      (
        mockPrismaService.reading_sessions.create as jest.Mock
      ).mockResolvedValue(mockSession);
      (mockPrismaService.contents.findUnique as jest.Mock).mockResolvedValue({
        id: testContentId,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/contents/${testContentId}/sessions`)
        .expect(201);

      expect(response.body.id).toBe("new-session-id");
      expect(response.body.phase).toBe("PRE");
    });
  });

  describe("Session Phase Transitions", () => {
    const sessionId = "session-789";

    it("should advance from PRE to DURING (and then to POST)", async () => {
      const mockSession = {
        id: sessionId,
        user_id: testUserId,
        phase: "PRE",
        contents: { id: testContentId },
      };

      // Mock getSession (used in updatePrePhase and advancePhase)
      (
        mockPrismaService.reading_sessions.findUnique as jest.Mock
      ).mockResolvedValue({
        ...mockSession,
        session_events: [],
      });

      // Mock update for PRE -> DURING
      (
        mockPrismaService.reading_sessions.update as jest.Mock
      ).mockResolvedValueOnce({
        ...mockSession,
        phase: "DURING",
      });

      // Mock update for DURING -> POST
      (
        mockPrismaService.reading_sessions.update as jest.Mock
      ).mockResolvedValueOnce({
        ...mockSession,
        phase: "POST",
      });

      // PRE phase update
      await request(app.getHttpServer())
        .put(`/api/v1/sessions/${sessionId}/pre`)
        .send({
          goalStatement: "My goal is to learn integration testing with Jest",
          predictionText:
            "I predict that mocking everything will work eventually",
          targetWordsJson: ["one", "two", "three", "four", "five"],
        })
        .expect(200);

      // Advance from DURING to POST
      // First refresh mock for getSession to return DURING phase
      (
        mockPrismaService.reading_sessions.findUnique as jest.Mock
      ).mockResolvedValue({
        ...mockSession,
        phase: "DURING",
        session_events: [],
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/advance`)
        .send({ toPhase: "POST" })
        .expect(201);

      expect(response.body.phase).toBe("POST");
    });

    it("should allow FINISHED when all DoD met", async () => {
      (
        mockPrismaService.reading_sessions.findUnique as jest.Mock
      ).mockResolvedValue({
        id: sessionId,
        user_id: testUserId,
        phase: "POST",
        content_id: testContentId,
        contents: { id: testContentId },
        session_events: [
          { event_type: "QUIZ_RESPONSE", payload_json: { correct: true } },
          { event_type: "PRODUCTION_SUBMIT", payload_json: { text: "prod" } },
        ],
      });

      // Mock cornell notes summary check
      (
        mockPrismaService.cornell_notes.findFirst as jest.Mock
      ).mockResolvedValue({
        summary_text: "Satisfied",
      });

      // Mock session events count for DoD (quiz and production)
      (mockPrismaService.session_events.count as jest.Mock).mockResolvedValue(
        1,
      );

      (
        mockPrismaService.reading_sessions.update as jest.Mock
      ).mockResolvedValue({
        id: sessionId,
        phase: "FINISHED",
        finished_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/advance`)
        .send({ toPhase: "FINISHED" })
        .expect(201);

      expect(response.body.phase).toBe("FINISHED");
    });
  });

  describe("Session Events", () => {
    const sessionId = "session-ev";

    it("should record quiz response event", async () => {
      (
        mockPrismaService.reading_sessions.findUnique as jest.Mock
      ).mockResolvedValue({ id: sessionId });
      (mockPrismaService.session_events.create as jest.Mock).mockResolvedValue({
        event_type: "QUIZ_RESPONSE",
        reading_session_id: sessionId,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/events`)
        .send({
          eventType: "QUIZ_RESPONSE",
          payload: { correct: true },
        })
        .expect(201);

      expect(response.body.event_type).toBe("QUIZ_RESPONSE");
      expect(mockPrismaService.session_events.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event_type: "QUIZ_RESPONSE",
          }),
        }),
      );
    });

    it("should record production submit event", async () => {
      (
        mockPrismaService.reading_sessions.findUnique as jest.Mock
      ).mockResolvedValue({ id: sessionId });
      (mockPrismaService.session_events.create as jest.Mock).mockResolvedValue({
        event_type: "PRODUCTION_SUBMIT",
        reading_session_id: sessionId,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/events`)
        .send({
          eventType: "PRODUCTION_SUBMIT",
          payload: { text: "My notes on testing" },
        })
        .expect(201);

      expect(response.body.event_type).toBe("PRODUCTION_SUBMIT");
    });
  });
});
