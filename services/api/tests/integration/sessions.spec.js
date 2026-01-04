"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const reading_sessions_service_1 = require("../../src/sessions/reading-sessions.service");
const profile_service_1 = require("../../src/profiles/profile.service");
const gamification_service_1 = require("../../src/gamification/gamification.service");
const vocab_service_1 = require("../../src/vocab/vocab.service");
const outcomes_service_1 = require("../../src/outcomes/outcomes.service");
const gating_service_1 = require("../../src/gating/gating.service");
const quick_command_parser_1 = require("../../src/sessions/parsers/quick-command.parser");
const activity_service_1 = require("../../src/activity/activity.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const ai_service_client_1 = require("../../src/ai-service/ai-service.client");
const provider_usage_service_1 = require("../../src/observability/provider-usage.service");
const reading_sessions_controller_1 = require("../../src/sessions/reading-sessions.controller");
const passport_1 = require("@nestjs/passport");
describe("Sessions Integration Tests (Mocked DB)", () => {
    let app;
    let prisma;
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
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [reading_sessions_controller_1.ReadingSessionsController],
            providers: [
                reading_sessions_service_1.ReadingSessionsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                {
                    provide: profile_service_1.ProfileService,
                    useValue: {
                        get: jest
                            .fn()
                            .mockResolvedValue({ education_level: "ADULTO_LEIGO" }),
                        getOrCreate: jest
                            .fn()
                            .mockResolvedValue({ education_level: "ADULTO_LEIGO" }),
                    },
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
                { provide: ai_service_client_1.AiServiceClient, useValue: {} },
                { provide: provider_usage_service_1.ProviderUsageService, useValue: {} },
                { provide: activity_service_1.ActivityService, useValue: {} },
                { provide: event_emitter_1.EventEmitter2, useValue: { emit: jest.fn() } },
            ],
        })
            .overrideGuard((0, passport_1.AuthGuard)("jwt"))
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
        const { ValidationPipe } = await Promise.resolve().then(() => require("@nestjs/common"));
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
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
            mockPrismaService.reading_sessions.create.mockResolvedValue(mockSession);
            mockPrismaService.contents.findUnique.mockResolvedValue({
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
            mockPrismaService.reading_sessions.findUnique.mockResolvedValue(Object.assign(Object.assign({}, mockSession), { session_events: [] }));
            mockPrismaService.reading_sessions.update.mockResolvedValueOnce(Object.assign(Object.assign({}, mockSession), { phase: "DURING" }));
            mockPrismaService.reading_sessions.update.mockResolvedValueOnce(Object.assign(Object.assign({}, mockSession), { phase: "POST" }));
            await request(app.getHttpServer())
                .put(`/api/v1/sessions/${sessionId}/pre`)
                .send({
                goalStatement: "My goal is to learn integration testing with Jest",
                predictionText: "I predict that mocking everything will work eventually",
                targetWordsJson: ["one", "two", "three", "four", "five"],
            })
                .expect(200);
            mockPrismaService.reading_sessions.findUnique.mockResolvedValue(Object.assign(Object.assign({}, mockSession), { phase: "DURING", session_events: [] }));
            const response = await request(app.getHttpServer())
                .post(`/api/v1/sessions/${sessionId}/advance`)
                .send({ toPhase: "POST" })
                .expect(201);
            expect(response.body.phase).toBe("POST");
        });
        it("should allow FINISHED when all DoD met", async () => {
            mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
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
            mockPrismaService.cornell_notes.findFirst.mockResolvedValue({
                summary_text: "Satisfied",
            });
            mockPrismaService.session_events.count.mockResolvedValue(1);
            mockPrismaService.reading_sessions.update.mockResolvedValue({
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
            mockPrismaService.reading_sessions.findUnique.mockResolvedValue({ id: sessionId });
            mockPrismaService.session_events.create.mockResolvedValue({
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
            expect(mockPrismaService.session_events.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    event_type: "QUIZ_RESPONSE",
                }),
            }));
        });
        it("should record production submit event", async () => {
            mockPrismaService.reading_sessions.findUnique.mockResolvedValue({ id: sessionId });
            mockPrismaService.session_events.create.mockResolvedValue({
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
//# sourceMappingURL=sessions.spec.js.map