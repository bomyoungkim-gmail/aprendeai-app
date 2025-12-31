"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const date_fns_1 = require("date-fns");
const routes_1 = require("../helpers/routes");
const auth_helper_1 = require("../helpers/auth.helper");
const review_controller_1 = require("../../src/review/review.controller");
const review_service_1 = require("../../src/review/review.service");
const profile_service_1 = require("../../src/profiles/profile.service");
const srs_service_1 = require("../../src/srs/srs.service");
describe("Review & SRS Integration Tests (Mocked DB)", () => {
    let app;
    let authHelper;
    let authToken;
    const testUserId = "test-user-id";
    const testContentId = "550e8400-e29b-41d4-a716-446655440001";
    const testVocabId = "550e8400-e29b-41d4-a716-446655440002";
    const mockPrismaService = {
        users: {
            create: jest.fn(),
            findUnique: jest.fn(),
            deleteMany: jest.fn(),
        },
        learner_profiles: {
            create: jest.fn(),
            findUnique: jest.fn(),
            deleteMany: jest.fn(),
        },
        contents: {
            create: jest.fn(),
            findUnique: jest.fn(),
            deleteMany: jest.fn(),
        },
        user_vocabularies: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        vocab_attempts: {
            create: jest.fn(),
        },
        $transaction: jest.fn((promises) => Promise.all(promises)),
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [review_controller_1.ReviewController],
            providers: [
                review_service_1.ReviewService,
                srs_service_1.SrsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                {
                    provide: profile_service_1.ProfileService,
                    useValue: {
                        get: jest.fn().mockResolvedValue({ daily_review_cap: 20 }),
                    },
                },
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        authHelper = new auth_helper_1.TestAuthHelper("test-secret");
        authToken = authHelper.generateAuthHeader({
            id: testUserId,
            email: "test@example.com",
            name: "Test User",
        });
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("GET /review/queue - Queue Retrieval", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should return empty queue when no due items", async () => {
            mockPrismaService.user_vocabularies.findMany.mockResolvedValue([]);
            mockPrismaService.user_vocabularies.count.mockResolvedValue(0);
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("v5/review/queue"))
                .set("Authorization", authToken)
                .expect(200);
            expect(response.body.vocab).toEqual([]);
            expect(response.body.stats.totalDue).toBe(0);
        });
        it("should return due vocabulary items", async () => {
            const mockVocab = {
                id: "v1",
                word: "test",
                language: "EN",
                srs_stage: "D1",
                due_at: (0, date_fns_1.subDays)(new Date(), 1),
            };
            mockPrismaService.user_vocabularies.findMany.mockResolvedValue([mockVocab]);
            mockPrismaService.user_vocabularies.count.mockResolvedValue(1);
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("v5/review/queue"))
                .set("Authorization", authToken)
                .expect(200);
            expect(response.body.vocab.length).toBe(1);
            expect(response.body.vocab[0].word).toBe("test");
            expect(response.body.vocab[0].srs_stage).toBe("D1");
        });
        it("should NOT return future items", async () => {
            mockPrismaService.user_vocabularies.findMany.mockResolvedValue([]);
            mockPrismaService.user_vocabularies.count.mockResolvedValue(0);
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("v5/review/queue"))
                .set("Authorization", authToken)
                .expect(200);
            expect(response.body.vocab).toEqual([]);
        });
        it("should respect daily review cap", async () => {
            const mockVocabItems = Array(20).fill({ word: "test" });
            mockPrismaService.user_vocabularies.findMany.mockResolvedValue(mockVocabItems);
            mockPrismaService.user_vocabularies.count.mockResolvedValue(25);
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("v5/review/queue"))
                .set("Authorization", authToken)
                .expect(200);
            expect(response.body.vocab.length).toBe(20);
            expect(response.body.stats.totalDue).toBe(25);
        });
    });
    describe("POST /review/attempt - SRS Transitions", () => {
        const vocabId = testVocabId;
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should transition NEW + OK -> D1", async () => {
            const mockVocab = {
                id: vocabId,
                user_id: testUserId,
                content_id: testContentId,
                word: "attempt-test",
                language: "EN",
                srs_stage: "NEW",
                due_at: new Date(),
                lapses_count: 0,
                mastery_meaning: 50,
            };
            const updatedVocab = Object.assign(Object.assign({}, mockVocab), { srs_stage: "D1", due_at: (0, date_fns_1.addDays)(new Date(), 1) });
            mockPrismaService.user_vocabularies.findUnique
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(updatedVocab);
            mockPrismaService.user_vocabularies.update.mockResolvedValue(updatedVocab);
            mockPrismaService.vocab_attempts.create.mockResolvedValue({});
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("v5/review/vocab/attempt"))
                .set("Authorization", authToken)
                .send({
                vocabId: vocabId,
                dimension: "MEANING",
                result: "OK",
            })
                .expect(201);
            expect(response.body.srs_stage).toBe("D1");
            expect(response.body.due_at).toBeDefined();
        });
        it("should transition with FAIL -> D1 (reset)", async () => {
            const mockVocab = {
                id: vocabId,
                user_id: testUserId,
                srs_stage: "D7",
                lapses_count: 0,
                mastery_meaning: 50,
            };
            const updatedVocab = {
                id: vocabId,
                srs_stage: "D1",
                lapses_count: 1,
            };
            mockPrismaService.user_vocabularies.findUnique
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(updatedVocab);
            mockPrismaService.user_vocabularies.update.mockResolvedValue(updatedVocab);
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("v5/review/vocab/attempt"))
                .set("Authorization", authToken)
                .send({
                vocabId: vocabId,
                dimension: "MEANING",
                result: "FAIL",
            })
                .expect(201);
            expect(response.body.srs_stage).toBe("D1");
            expect(response.body.lapses_count).toBeGreaterThan(0);
        });
        it("should update due date correctly for D30", async () => {
            const mockVocab = {
                id: vocabId,
                user_id: testUserId,
                srs_stage: "D14",
                mastery_meaning: 50,
            };
            const beforeAttempt = new Date();
            const expectedDue = (0, date_fns_1.addDays)(beforeAttempt, 30);
            const updatedVocab = {
                id: vocabId,
                srs_stage: "D30",
                due_at: expectedDue,
            };
            mockPrismaService.user_vocabularies.findUnique
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(updatedVocab);
            mockPrismaService.user_vocabularies.update.mockResolvedValue(updatedVocab);
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("v5/review/vocab/attempt"))
                .set("Authorization", authToken)
                .send({
                vocabId: vocabId,
                dimension: "MEANING",
                result: "OK",
            })
                .expect(201);
            expect(response.body.srs_stage).toBe("D30");
            const dueDate = new Date(response.body.due_at);
            const diffDays = Math.abs(dueDate.getTime() - expectedDue.getTime()) /
                (1000 * 60 * 60 * 24);
            expect(diffDays).toBeLessThan(1);
        });
        it("should record attempt in history", async () => {
            const mockVocab = {
                id: vocabId,
                user_id: testUserId,
                srs_stage: "NEW",
                mastery_meaning: 50,
            };
            const updatedVocab = Object.assign(Object.assign({}, mockVocab), { srs_stage: "D1" });
            mockPrismaService.user_vocabularies.findUnique
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(updatedVocab);
            mockPrismaService.user_vocabularies.update.mockResolvedValue(updatedVocab);
            mockPrismaService.vocab_attempts.create.mockResolvedValue({});
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("v5/review/vocab/attempt"))
                .set("Authorization", authToken)
                .send({
                vocabId: vocabId,
                dimension: "MEANING",
                result: "OK",
            })
                .expect(201);
            expect(mockPrismaService.vocab_attempts.create).toHaveBeenCalled();
        });
    });
    describe("SRS Edge Cases", () => {
        const vocabId = "550e8400-e29b-41d4-a716-446655440003";
        it("should keep MASTERED on OK", async () => {
            const mockVocab = {
                id: vocabId,
                user_id: testUserId,
                srs_stage: "MASTERED",
                mastery_meaning: 90,
            };
            mockPrismaService.user_vocabularies.findUnique
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab);
            mockPrismaService.user_vocabularies.update.mockResolvedValue(mockVocab);
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("v5/review/vocab/attempt"))
                .set("Authorization", authToken)
                .send({
                vocabId: vocabId,
                dimension: "MEANING",
                result: "OK",
            })
                .expect(201);
            expect(response.body.srs_stage).toBe("MASTERED");
        });
        it("should regress MASTERED on FAIL", async () => {
            const mockVocab = {
                id: vocabId,
                user_id: testUserId,
                srs_stage: "MASTERED",
                mastery_meaning: 90,
            };
            const updatedVocab = {
                id: vocabId,
                srs_stage: "D1",
            };
            mockPrismaService.user_vocabularies.findUnique
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(mockVocab)
                .mockResolvedValueOnce(updatedVocab);
            mockPrismaService.user_vocabularies.update.mockResolvedValue(updatedVocab);
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("v5/review/vocab/attempt"))
                .set("Authorization", authToken)
                .send({
                vocabId: vocabId,
                dimension: "MEANING",
                result: "FAIL",
            })
                .expect(201);
            expect(response.body.srs_stage).toBe("D1");
        });
    });
});
//# sourceMappingURL=review-srs.spec.js.map