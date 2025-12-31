"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const reading_sessions_service_1 = require("../../src/sessions/reading-sessions.service");
const ai_service_client_1 = require("../../src/ai-service/ai-service.client");
const provider_usage_service_1 = require("../../src/observability/provider-usage.service");
const profile_service_1 = require("../../src/profiles/profile.service");
const gamification_service_1 = require("../../src/gamification/gamification.service");
const vocab_service_1 = require("../../src/vocab/vocab.service");
const outcomes_service_1 = require("../../src/outcomes/outcomes.service");
const gating_service_1 = require("../../src/gating/gating.service");
const quick_command_parser_1 = require("../../src/sessions/parsers/quick-command.parser");
const activity_service_1 = require("../../src/activity/activity.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const reading_sessions_controller_1 = require("../../src/sessions/reading-sessions.controller");
const passport_1 = require("@nestjs/passport");
describe("AI Gateway - Token Tracking Integration (e2e)", () => {
    let app;
    let prisma;
    let aiServiceClient;
    const mockAiServiceClient = {
        sendPrompt: jest.fn(),
    };
    beforeAll(async () => {
        process.env.RABBITMQ_URL =
            process.env.RABBITMQ_URL || "amqp://127.0.0.1:5672";
        process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379/0";
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [reading_sessions_controller_1.ReadingSessionsController],
            providers: [
                reading_sessions_service_1.ReadingSessionsService,
                provider_usage_service_1.ProviderUsageService,
                prisma_service_1.PrismaService,
                {
                    provide: ai_service_client_1.AiServiceClient,
                    useValue: mockAiServiceClient,
                },
                {
                    provide: profile_service_1.ProfileService,
                    useValue: { getOrCreate: jest.fn().mockResolvedValue({}) },
                },
                { provide: gamification_service_1.GamificationService, useValue: {} },
                { provide: vocab_service_1.VocabService, useValue: {} },
                { provide: outcomes_service_1.OutcomesService, useValue: {} },
                {
                    provide: gating_service_1.GatingService,
                    useValue: { determineLayer: jest.fn().mockResolvedValue("L1") },
                },
                {
                    provide: quick_command_parser_1.QuickCommandParser,
                    useValue: { parse: jest.fn().mockReturnValue([]) },
                },
                { provide: activity_service_1.ActivityService, useValue: {} },
                { provide: event_emitter_1.EventEmitter2, useValue: { emit: jest.fn() } },
            ],
        })
            .overrideGuard((0, passport_1.AuthGuard)("jwt"))
            .useValue({
            canActivate: (ctx) => {
                const req = ctx.switchToHttp().getRequest();
                req.user = { id: "test-user-456" };
                return true;
            },
        })
            .compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        await app.init();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        aiServiceClient = moduleFixture.get(ai_service_client_1.AiServiceClient);
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("POST /sessions/:sessionId/prompt", () => {
        it("should track usage when AI service returns usage metadata", async () => {
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
            const trackUsageSpy = jest
                .spyOn(provider_usage_service_1.ProviderUsageService.prototype, "trackUsage")
                .mockImplementation(() => Promise.resolve({}));
            const sessionId = "test-session-123";
            const userId = "test-user-456";
            jest.spyOn(prisma.reading_sessions, "findUnique").mockResolvedValue({
                id: sessionId,
                user_id: userId,
                content_id: "content-1",
                session_events: [],
            });
            jest.spyOn(prisma.users, "findUnique").mockResolvedValue({
                id: userId,
                last_institution_id: "inst-789",
            });
            jest.spyOn(prisma.family_members, "findFirst").mockResolvedValue({
                user_id: userId,
                family_id: "family-999",
            });
            jest.spyOn(prisma.session_events, "findMany").mockResolvedValue([]);
            jest
                .spyOn(prisma.session_events, "createMany")
                .mockResolvedValue({ count: 0 });
            jest
                .spyOn(prisma.contents, "findUnique")
                .mockResolvedValue({ id: "content-1", raw_text: "sample" });
            const response = await request(app.getHttpServer())
                .post(`/api/v1/sessions/${sessionId}/prompt`)
                .send({
                promptMessage: {
                    threadId: "thread-123",
                    text: "Test prompt",
                    actorRole: "LEARNER",
                },
            })
                .expect(common_1.HttpStatus.CREATED);
            expect(mockAiServiceClient.sendPrompt).toHaveBeenCalled();
            expect(trackUsageSpy).toHaveBeenCalledWith(expect.objectContaining({
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
            }));
            expect(response.body.usage).toEqual(mockAiResponse.usage);
        });
        it("should not crash when AI service does not return usage metadata", async () => {
            const mockAiResponse = {
                threadId: "thread-123",
                nextPrompt: "AI response without usage",
                quickReplies: [],
            };
            mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);
            const sessionId = "test-session-123";
            const userId = "test-user-456";
            jest.spyOn(prisma.reading_sessions, "findUnique").mockResolvedValue({
                id: sessionId,
                user_id: userId,
                content_id: "content-1",
                session_events: [],
            });
            jest.spyOn(prisma.session_events, "findMany").mockResolvedValue([]);
            jest
                .spyOn(prisma.session_events, "createMany")
                .mockResolvedValue({ count: 0 });
            jest
                .spyOn(prisma.contents, "findUnique")
                .mockResolvedValue({ id: "content-1", raw_text: "sample" });
            const trackUsageSpy = jest
                .spyOn(provider_usage_service_1.ProviderUsageService.prototype, "trackUsage")
                .mockImplementation(() => Promise.resolve({}));
            await request(app.getHttpServer())
                .post(`/api/v1/sessions/${sessionId}/prompt`)
                .send({
                promptMessage: {
                    threadId: "thread-123",
                    text: "Test",
                    actorRole: "LEARNER",
                },
            })
                .expect(common_1.HttpStatus.CREATED);
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
            });
            jest.spyOn(prisma.session_events, "findMany").mockResolvedValue([]);
            jest
                .spyOn(prisma.session_events, "createMany")
                .mockResolvedValue({ count: 0 });
            jest
                .spyOn(prisma.contents, "findUnique")
                .mockResolvedValue({ id: "content-1", raw_text: "sample" });
            jest.spyOn(prisma.users, "findUnique").mockResolvedValue({
                id: userId,
                institution_id: null,
            });
            jest.spyOn(prisma.family_members, "findFirst").mockResolvedValue(null);
            const trackUsageSpy = jest.spyOn(provider_usage_service_1.ProviderUsageService.prototype, "trackUsage");
            await request(app.getHttpServer())
                .post(`/api/v1/sessions/${sessionId}/prompt`)
                .send({
                promptMessage: {
                    threadId: "thread-123",
                    text: "Test",
                    actorRole: "LEARNER",
                },
            })
                .expect(common_1.HttpStatus.CREATED);
            expect(trackUsageSpy).toHaveBeenCalledWith(expect.objectContaining({
                userId,
                familyId: undefined,
                institutionId: null,
            }));
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
            await prisma.provider_usage.delete({ where: { id: createdUsage.id } });
        });
    });
});
//# sourceMappingURL=ai-gateway-usage-tracking.integration.spec.js.map