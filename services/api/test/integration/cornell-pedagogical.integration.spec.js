"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const auth_helper_1 = require("../helpers/auth.helper");
const app_module_1 = require("../../src/app.module");
describe("Cornell Pedagogical Endpoints (Integration)", () => {
    let app;
    let prismaService;
    let authHelper;
    let authToken;
    let testContentId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        prismaService = moduleFixture.get(prisma_service_1.PrismaService);
        authHelper = new auth_helper_1.TestAuthHelper(process.env.JWT_SECRET || "test-secret");
        const testUser = (0, auth_helper_1.createTestUser)({ id: "integration-test-user" });
        authToken = authHelper.generateAuthHeader(testUser);
        await prismaService.users.upsert({
            where: { id: testUser.id },
            update: {},
            create: {
                id: testUser.id,
                email: "ped-test@example.com",
                name: "Pedagogical Test User",
                status: "ACTIVE",
            },
        });
    });
    afterAll(async () => {
        if (testContentId) {
            await prismaService.content_pedagogical_data.deleteMany({
                where: { content_id: testContentId },
            });
            await prismaService.contents.deleteMany({
                where: { id: testContentId },
            });
        }
        await prismaService.users.deleteMany({
            where: { id: "integration-test-user" },
        });
        await app.close();
    });
    beforeEach(async () => {
        const content = await prismaService.contents.create({
            data: {
                id: `content-ped-${Date.now()}`,
                title: "Test Educational Content",
                type: "PDF",
                owner_user_id: "integration-test-user",
                original_language: "PT_BR",
                raw_text: "Test source text",
            },
        });
        testContentId = content.id;
    });
    afterEach(async () => {
        if (testContentId) {
            await prismaService.content_pedagogical_data.deleteMany({
                where: { content_id: testContentId },
            });
            await prismaService.game_results.deleteMany({
                where: { content_id: testContentId },
            });
        }
    });
    describe("POST /cornell/contents/:id/pedagogical", () => {
        it("should create pedagogical data for content", async () => {
            const pedagogicalData = {
                vocabularyTriage: {
                    words: [
                        {
                            word: "Photosynthesis",
                            definition: "Process of converting light to energy",
                            difficulty: "medium",
                        },
                    ],
                },
                socraticQuestions: [
                    {
                        sectionId: "intro",
                        questions: [
                            { question: "What is the main process?", type: "INFERENCE" },
                        ],
                    },
                ],
                quizQuestions: [
                    {
                        sectionId: "intro",
                        questions: [
                            {
                                question: "What is photosynthesis?",
                                options: ["A", "B", "C"],
                                correct: 0,
                            },
                        ],
                    },
                ],
            };
            const response = await request(app.getHttpServer())
                .post(`/cornell/contents/${testContentId}/pedagogical`)
                .set("Authorization", authToken)
                .send(pedagogicalData)
                .expect(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.content_id).toBe(testContentId);
            expect(response.body.vocabulary_triage).toEqual(pedagogicalData.vocabularyTriage);
        });
        it("should update existing pedagogical data (upsert)", async () => {
            const initialData = {
                vocabularyTriage: {
                    words: [{ word: "Initial", definition: "First version" }],
                },
            };
            await request(app.getHttpServer())
                .post(`/cornell/contents/${testContentId}/pedagogical`)
                .set("Authorization", authToken)
                .send(initialData)
                .expect(201);
            const updatedData = {
                vocabularyTriage: {
                    words: [{ word: "Updated", definition: "Second version" }],
                },
            };
            const response = await request(app.getHttpServer())
                .post(`/cornell/contents/${testContentId}/pedagogical`)
                .set("Authorization", authToken)
                .send(updatedData)
                .expect(201);
            expect(response.body.vocabulary_triage.words[0].word).toBe("Updated");
        });
        it("should reject unauthorized requests", async () => {
            await request(app.getHttpServer())
                .post(`/cornell/contents/${testContentId}/pedagogical`)
                .send({ vocabularyTriage: {} })
                .expect(401);
        });
    });
    describe("GET /cornell/contents/:id/context", () => {
        beforeEach(async () => {
            await prismaService.content_pedagogical_data.create({
                data: {
                    id: `ped-${Date.now()}`,
                    content_id: testContentId,
                    vocabulary_triage: { words: [] },
                    processing_version: "v1.0",
                },
            });
        });
        it("should retrieve pedagogical context", async () => {
            const response = await request(app.getHttpServer())
                .get(`/cornell/contents/${testContentId}/context`)
                .set("Authorization", authToken)
                .expect(200);
            expect(response.body).toHaveProperty("pedagogicalData");
            expect(response.body.pedagogicalData).toHaveProperty("content_id", testContentId);
        });
        it("should return null pedagogicalData if none exists", async () => {
            await prismaService.content_pedagogical_data.deleteMany({
                where: { content_id: testContentId },
            });
            const response = await request(app.getHttpServer())
                .get(`/cornell/contents/${testContentId}/context`)
                .set("Authorization", authToken)
                .expect(200);
            expect(response.body.pedagogicalData).toBeNull();
        });
        it("should reject unauthorized requests", async () => {
            await request(app.getHttpServer())
                .get(`/cornell/contents/${testContentId}/context`)
                .expect(401);
        });
    });
    describe("Full Flow: Worker -> API -> Storage", () => {
        it("should handle complete pedagogical enrichment flow", async () => {
            const enrichmentData = {
                vocabularyTriage: {
                    words: [
                        {
                            word: "Ecosystem",
                            definition: "Biological community",
                            difficulty: "medium",
                        },
                    ],
                },
                socraticQuestions: [
                    {
                        sectionId: "chapter1",
                        questions: [
                            {
                                question: "How do organisms interact?",
                                type: "APPLICATION",
                                difficulty: "hard",
                            },
                        ],
                    },
                ],
                quizQuestions: [],
                tabooCards: [
                    {
                        targetWord: "Ecosystem",
                        forbiddenWords: ["environment", "nature"],
                        hint: "Community",
                    },
                ],
                bossFightConfig: {
                    vocabList: ["Ecosystem"],
                    difficulty: "medium",
                    rounds: 3,
                },
                processingVersion: "v1.0",
            };
            const saveResponse = await request(app.getHttpServer())
                .post(`/cornell/contents/${testContentId}/pedagogical`)
                .set("Authorization", authToken)
                .send(enrichmentData)
                .expect(201);
            expect(saveResponse.body).toHaveProperty("id");
            const contextResponse = await request(app.getHttpServer())
                .get(`/cornell/contents/${testContentId}/context`)
                .set("Authorization", authToken)
                .expect(200);
            expect(contextResponse.body.pedagogicalData.vocabulary_triage).toEqual(enrichmentData.vocabularyTriage);
            expect(contextResponse.body.pedagogicalData.taboo_cards).toEqual(enrichmentData.tabooCards);
        });
    });
});
//# sourceMappingURL=cornell-pedagogical.integration.spec.js.map