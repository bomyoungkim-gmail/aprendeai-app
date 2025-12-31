import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TestAuthHelper, createTestUser } from "../helpers/auth.helper";
import { AppModule } from "../../src/app.module";

describe("Cornell Pedagogical Endpoints (Integration)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let testContentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authHelper = new TestAuthHelper(process.env.JWT_SECRET || "test-secret");

    const testUser = createTestUser({ id: "integration-test-user" });
    authToken = authHelper.generateAuthHeader(testUser);

    // Ensure user exists in DB for foreign key constraints
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
    // Cleanup test data
    if (testContentId) {
      await prismaService.content_pedagogical_data.deleteMany({
        where: { content_id: testContentId },
      });
      await prismaService.contents.deleteMany({
        where: { id: testContentId },
      });
    }

    // Delete test user
    await prismaService.users.deleteMany({
      where: { id: "integration-test-user" },
    });

    await app.close();
  });

  beforeEach(async () => {
    // Create test content
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
    // Clean up after each test
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
      expect(response.body.vocabulary_triage).toEqual(
        pedagogicalData.vocabularyTriage,
      );
    });

    it("should update existing pedagogical data (upsert)", async () => {
      // First creation
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

      // Update
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
      // Create pedagogical data for testing
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
      expect(response.body.pedagogicalData).toHaveProperty(
        "content_id",
        testContentId,
      );
    });

    it("should return null pedagogicalData if none exists", async () => {
      // Delete the created data
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
      // Simulate worker calling API to save enrichment
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

      // Step 1: Worker saves data
      const saveResponse = await request(app.getHttpServer())
        .post(`/cornell/contents/${testContentId}/pedagogical`)
        .set("Authorization", authToken)
        .send(enrichmentData)
        .expect(201);

      expect(saveResponse.body).toHaveProperty("id");

      // Step 2: Frontend retrieves context
      const contextResponse = await request(app.getHttpServer())
        .get(`/cornell/contents/${testContentId}/context`)
        .set("Authorization", authToken)
        .expect(200);

      expect(contextResponse.body.pedagogicalData.vocabulary_triage).toEqual(
        enrichmentData.vocabularyTriage,
      );
      expect(contextResponse.body.pedagogicalData.taboo_cards).toEqual(
        enrichmentData.tabooCards,
      );
    });
  });
});
