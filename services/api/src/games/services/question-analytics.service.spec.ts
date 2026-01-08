import { Test, TestingModule } from "@nestjs/testing";
import { QuestionAnalyticsService } from "./question-analytics.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("QuestionAnalyticsService", () => {
  let service: QuestionAnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    question_results: {
      create: jest.fn(),
    },
    question_analytics: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    // question_bank removed - service doesn't use it directly
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionAnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<QuestionAnalyticsService>(QuestionAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("recordResult", () => {
    const resultDto = {
      questionId: "q1",
      score: 80,
      timeTaken: 30,
      isCorrect: true,
      selfRating: 2,
    };

    it("should record result and create analytics if not exists", async () => {
      (prisma.question_results.create as jest.Mock).mockResolvedValue({
        id: "r1",
        ...resultDto,
      });
      (prisma.question_analytics.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // First check before update
        .mockResolvedValueOnce({
          // Return after update
          questionId: "q1",
          totalAttempts: 1,
          avgScore: 80,
        });

      await service.recordResult("user1", resultDto);

      expect(prisma.question_results.create).toHaveBeenCalled();
      expect(prisma.question_analytics.create).toHaveBeenCalled();
      // question_bank.update removed - not used by service
    });

    it("should update existing analytics", async () => {
      (prisma.question_results.create as jest.Mock).mockResolvedValue({
        id: "r2",
        ...resultDto,
      });
      (prisma.question_analytics.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          questionId: "q1",
          totalAttempts: 1,
          avgScore: 50,
          avgTime: 50,
          successRate: 0,
        })
        .mockResolvedValueOnce({
          // Return after update
          questionId: "q1",
          totalAttempts: 2,
          avgScore: 65,
        });

      await service.recordResult("user1", resultDto);

      expect(prisma.question_results.create).toHaveBeenCalled();
      expect(prisma.question_analytics.update).toHaveBeenCalled();
      // question_bank.update removed - not used by service
    });
  });
});
