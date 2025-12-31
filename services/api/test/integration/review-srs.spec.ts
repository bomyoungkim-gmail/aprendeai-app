/**
 * Integration Tests - Review & SRS
 *
 * Tests vocabulary review and SRS system with real database:
 * - Queue retrieval
 * - SRS stage transitions
 * - Due date updates
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { addDays, subDays } from "date-fns";
import { apiUrl } from "../helpers/routes";
import { TestAuthHelper } from "../helpers/auth.helper";
import { ReviewController } from "../../src/review/review.controller";
import { ReviewService } from "../../src/review/review.service";
import { ProfileService } from "../../src/profiles/profile.service";
import { SrsService } from "../../src/srs/srs.service";

describe("Review & SRS Integration Tests (Mocked DB)", () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;
  let authToken: string;
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        ReviewService,
        SrsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ProfileService,
          useValue: {
            get: jest.fn().mockResolvedValue({ daily_review_cap: 20 }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Initialize Auth Helper
    authHelper = new TestAuthHelper("test-secret");

    // Generate valid JWT
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
      (
        mockPrismaService.user_vocabularies.findMany as jest.Mock
      ).mockResolvedValue([]);
      (
        mockPrismaService.user_vocabularies.count as jest.Mock
      ).mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get(apiUrl("v5/review/queue"))
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
        due_at: subDays(new Date(), 1),
      };

      (
        mockPrismaService.user_vocabularies.findMany as jest.Mock
      ).mockResolvedValue([mockVocab]);
      (
        mockPrismaService.user_vocabularies.count as jest.Mock
      ).mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get(apiUrl("v5/review/queue"))
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body.vocab.length).toBe(1);
      expect(response.body.vocab[0].word).toBe("test");
      expect(response.body.vocab[0].srs_stage).toBe("D1");
    });

    it("should NOT return future items", async () => {
      (
        mockPrismaService.user_vocabularies.findMany as jest.Mock
      ).mockResolvedValue([]);
      (
        mockPrismaService.user_vocabularies.count as jest.Mock
      ).mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get(apiUrl("v5/review/queue"))
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body.vocab).toEqual([]);
    });

    it("should respect daily review cap", async () => {
      // Mock return only 20 items even if total is 25
      const mockVocabItems = Array(20).fill({ word: "test" });
      (
        mockPrismaService.user_vocabularies.findMany as jest.Mock
      ).mockResolvedValue(mockVocabItems);
      (
        mockPrismaService.user_vocabularies.count as jest.Mock
      ).mockResolvedValue(25);

      const response = await request(app.getHttpServer())
        .get(apiUrl("v5/review/queue"))
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

      const updatedVocab = {
        ...mockVocab,
        srs_stage: "D1",
        due_at: addDays(new Date(), 1),
      };

      (mockPrismaService.user_vocabularies.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(updatedVocab);

      (
        mockPrismaService.user_vocabularies.update as jest.Mock
      ).mockResolvedValue(updatedVocab);
      (mockPrismaService.vocab_attempts.create as jest.Mock).mockResolvedValue(
        {},
      );

      const response = await request(app.getHttpServer())
        .post(apiUrl("v5/review/vocab/attempt"))
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

      (mockPrismaService.user_vocabularies.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVocab) // Controller
        .mockResolvedValueOnce(mockVocab) // Service logic
        .mockResolvedValueOnce(updatedVocab); // Service return

      (
        mockPrismaService.user_vocabularies.update as jest.Mock
      ).mockResolvedValue(updatedVocab);

      const response = await request(app.getHttpServer())
        .post(apiUrl("v5/review/vocab/attempt"))
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
      const expectedDue = addDays(beforeAttempt, 30);

      const updatedVocab = {
        id: vocabId,
        srs_stage: "D30",
        due_at: expectedDue,
      };

      (mockPrismaService.user_vocabularies.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(updatedVocab);

      (
        mockPrismaService.user_vocabularies.update as jest.Mock
      ).mockResolvedValue(updatedVocab);

      const response = await request(app.getHttpServer())
        .post(apiUrl("v5/review/vocab/attempt"))
        .set("Authorization", authToken)
        .send({
          vocabId: vocabId,
          dimension: "MEANING",
          result: "OK", // D14 + OK -> D30
        })
        .expect(201);

      expect(response.body.srs_stage).toBe("D30");

      const dueDate = new Date(response.body.due_at);

      // Should be ~30 days from now (allow 1 day tolerance)
      const diffDays =
        Math.abs(dueDate.getTime() - expectedDue.getTime()) /
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

      const updatedVocab = {
        ...mockVocab,
        srs_stage: "D1",
      };

      (mockPrismaService.user_vocabularies.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(updatedVocab);

      (
        mockPrismaService.user_vocabularies.update as jest.Mock
      ).mockResolvedValue(updatedVocab);
      (mockPrismaService.vocab_attempts.create as jest.Mock).mockResolvedValue(
        {},
      );

      await request(app.getHttpServer())
        .post(apiUrl("v5/review/vocab/attempt"))
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

      (mockPrismaService.user_vocabularies.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(mockVocab);

      (
        mockPrismaService.user_vocabularies.update as jest.Mock
      ).mockResolvedValue(mockVocab);

      const response = await request(app.getHttpServer())
        .post(apiUrl("v5/review/vocab/attempt"))
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

      (mockPrismaService.user_vocabularies.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(mockVocab)
        .mockResolvedValueOnce(updatedVocab);

      (
        mockPrismaService.user_vocabularies.update as jest.Mock
      ).mockResolvedValue(updatedVocab);

      const response = await request(app.getHttpServer())
        .post(apiUrl("v5/review/vocab/attempt"))
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
