import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ReadingSessionsService } from "../../src/sessions/reading-sessions.service";
import { AiServiceClient } from "../../src/ai-service/ai-service.client";
import { ProviderUsageService } from "../../src/observability/provider-usage.service";
import { ProfileService } from "../../src/profiles/profile.service";
import { GamificationService } from "../../src/gamification/gamification.service";
import { VocabService } from "../../src/vocab/vocab.service";
import { OutcomesService } from "../../src/outcomes/outcomes.service";
import { GatingService } from "../../src/gating/gating.service";
import { QuickCommandParser } from "../../src/sessions/parsers/quick-command.parser";
import { ActivityService } from "../../src/activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ReadingSessionsController } from "../../src/sessions/reading-sessions.controller";
import { AuthGuard } from "@nestjs/passport";

describe("AI Gateway - Token Tracking Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aiServiceClient: AiServiceClient;

  const mockAiServiceClient = {
    sendPrompt: jest.fn(),
  };

  beforeAll(async () => {
    // Ensure localhost vs 127.0.0.1 compatibility on Windows
    process.env.RABBITMQ_URL =
      process.env.RABBITMQ_URL || "amqp://127.0.0.1:5672";
    process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379/0";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReadingSessionsController],
      providers: [
        ReadingSessionsService,
        ProviderUsageService,
        PrismaService,
        {
          provide: AiServiceClient,
          useValue: mockAiServiceClient,
        },
        {
          provide: ProfileService,
          useValue: { getOrCreate: jest.fn().mockResolvedValue({}) },
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
        { provide: ActivityService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard("jwt"))
      .useValue({
        canActivate: (ctx) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { id: "test-user-456" }; // Default user for tests
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    aiServiceClient = moduleFixture.get<AiServiceClient>(AiServiceClient);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /sessions/:sessionId/prompt", () => {
    it("should track usage when AI service returns usage metadata", async () => {
      // Mock AI Service response with usage data
      const mockAiResponse = {
        threadId: "thread-123",
        nextPrompt: "AI response text",
        quickReplies: [],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 80,
          total_tokens: 230,
          cost_est_usd: 0.0023,
        },
      };

      mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);

      // Spy on ProviderUsageService
      const trackUsageSpy = jest
        .spyOn(ProviderUsageService.prototype, "trackUsage")
        .mockImplementation(() => Promise.resolve({} as any));

      const sessionId = "test-session-123";
      const userId = "test-user-456";

      // Mock session lookup
      jest.spyOn(prisma.reading_sessions, "findUnique").mockResolvedValue({
        id: sessionId,
        user_id: userId,
        content_id: "content-1",
        session_events: [],
        // ... other fields
      } as any);

      // Mock user context lookup
      jest.spyOn(prisma.users, "findUnique").mockResolvedValue({
        id: userId,
        last_institution_id: "inst-789",
        // ... other fields
      } as any);

      jest.spyOn(prisma.family_members, "findFirst").mockResolvedValue({
        user_id: userId,
        family_id: "family-999",
        // ... other fields
      } as any);

      jest.spyOn(prisma.session_events, "findMany").mockResolvedValue([]);
      jest
        .spyOn(prisma.session_events, "createMany")
        .mockResolvedValue({ count: 0 } as any);
      jest
        .spyOn(prisma.contents, "findUnique")
        .mockResolvedValue({ id: "content-1", raw_text: "sample" } as any);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/prompt`)
        .send({
          promptMessage: {
            threadId: "thread-123",
            text: "Test prompt",
            actorRole: "LEARNER",
          },
        })
        .expect(HttpStatus.CREATED);

      // Verify AI service was called
      expect(mockAiServiceClient.sendPrompt).toHaveBeenCalled();

      // Verify usage was tracked with correct data
      expect(trackUsageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "educator_agent",
          operation: "turn",
          promptTokens: 150,
          completionTokens: 80,
          tokens: 230,
          costUsd: 0.0023,
          userId,
          familyId: "family-999",
          institutionId: "inst-789",
          feature: "educator_chat",
        }),
      );

      // Verify response includes usage
      expect(response.body.usage).toEqual(mockAiResponse.usage);
    });

    it("should not crash when AI service does not return usage metadata", async () => {
      // AI response without usage field
      const mockAiResponse = {
        threadId: "thread-123",
        nextPrompt: "AI response without usage",
        quickReplies: [],
        // NO usage field
      };

      mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);

      const sessionId = "test-session-123";
      const userId = "test-user-456";

      jest.spyOn(prisma.reading_sessions, "findUnique").mockResolvedValue({
        id: sessionId,
        user_id: userId,
        content_id: "content-1",
        session_events: [],
      } as any);

      jest.spyOn(prisma.session_events, "findMany").mockResolvedValue([]);
      jest
        .spyOn(prisma.session_events, "createMany")
        .mockResolvedValue({ count: 0 } as any);
      jest
        .spyOn(prisma.contents, "findUnique")
        .mockResolvedValue({ id: "content-1", raw_text: "sample" } as any);

      const trackUsageSpy = jest
        .spyOn(ProviderUsageService.prototype, "trackUsage")
        .mockImplementation(() => Promise.resolve({} as any));

      await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/prompt`)
        .send({
          promptMessage: {
            threadId: "thread-123",
            text: "Test",
            actorRole: "LEARNER",
          },
        })
        .expect(HttpStatus.CREATED);

      // trackUsage should NOT be called
      expect(trackUsageSpy).not.toHaveBeenCalled();
    });

    it("should track usage even when user has no family", async () => {
      const mockAiResponse = {
        threadId: "thread-123",
        nextPrompt: "Response",
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80,
        },
      };

      mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);

      const sessionId = "session-solo";
      const userId = "test-user-456";

      jest.spyOn(prisma.reading_sessions, "findUnique").mockResolvedValue({
        id: sessionId,
        user_id: userId,
        content_id: "content-1",
        session_events: [],
      } as any);

      jest.spyOn(prisma.session_events, "findMany").mockResolvedValue([]);
      jest
        .spyOn(prisma.session_events, "createMany")
        .mockResolvedValue({ count: 0 } as any);
      jest
        .spyOn(prisma.contents, "findUnique")
        .mockResolvedValue({ id: "content-1", raw_text: "sample" } as any);

      jest.spyOn(prisma.users, "findUnique").mockResolvedValue({
        id: userId,
        institution_id: null,
      } as any);

      // No family membership
      jest.spyOn(prisma.family_members, "findFirst").mockResolvedValue(null);

      const trackUsageSpy = jest.spyOn(
        ProviderUsageService.prototype,
        "trackUsage",
      );

      await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/prompt`)
        .send({
          promptMessage: {
            threadId: "thread-123",
            text: "Test",
            actorRole: "LEARNER",
          },
        })
        .expect(HttpStatus.CREATED);

      // Should still track, but with null familyId
      expect(trackUsageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          familyId: undefined,
          institutionId: null,
        }),
      );
    });
  });

  describe("Database Persistence", () => {
    it("should persist complete usage record to database", async () => {
      const usageData = {
        provider: "educator_agent",
        operation: "turn",
        tokens: 200,
        prompt_tokens: 120,
        completion_tokens: 80,
        total_tokens: 200,
        cost_usd: 0.002,
        user_id: "db-user-123",
        family_id: null,
        institution_id: null,
        feature: "educator_chat",
        metadata: { session_id: "db-session-999" },
      };

      // Ensure user exists for FK
      await prisma.users.upsert({
        where: { id: usageData.user_id },
        update: {},
        create: {
          id: usageData.user_id,
          email: `db-user-${Date.now()}@test.com`,
          name: "DB Test User",
          password_hash: "hash",
          schooling_level: "Superior",
          updated_at: new Date(),
        },
      });

      // Use actual Prisma to test database write
      const createdUsage = await prisma.provider_usage.create({
        data: {
          id: "test-id-" + Date.now(),
          provider: usageData.provider,
          operation: usageData.operation,
          tokens: usageData.tokens,
          prompt_tokens: usageData.prompt_tokens,
          completion_tokens: usageData.completion_tokens,
          total_tokens: usageData.total_tokens,
          cost_usd: usageData.cost_usd,
          user_id: usageData.user_id,
          family_id: usageData.family_id,
          institution_id: usageData.institution_id,
          feature: usageData.feature,
          metadata: usageData.metadata,
          timestamp: new Date(),
        },
      });

      expect(createdUsage).toMatchObject({
        provider: "educator_agent",
        prompt_tokens: 120,
        completion_tokens: 80,
        total_tokens: 200,
        cost_usd: 0.002,
        feature: "educator_chat",
      });

      // Cleanup
      await prisma.provider_usage.delete({ where: { id: createdUsage.id } });
    });
  });
});
