import { Test, TestingModule } from "@nestjs/testing";
import { QuestionSelectionService } from "./question-selection.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AIQuestionGeneratorService } from "./ai-question-generator.service";
import { EducationLevel } from "../dto/question-bank.dto";

describe("QuestionSelectionService", () => {
  let service: QuestionSelectionService;
  let prisma: PrismaService;
  let aiGenerator: AIQuestionGeneratorService;

  const mockPrismaService = {
    question_bank: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAiGenerator = {
    generate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionSelectionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AIQuestionGeneratorService, useValue: mockAiGenerator },
      ],
    }).compile();

    service = module.get<QuestionSelectionService>(QuestionSelectionService);
    prisma = module.get<PrismaService>(PrismaService);
    aiGenerator = module.get<AIQuestionGeneratorService>(
      AIQuestionGeneratorService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getQuestionsForUser", () => {
    const params = {
      gameType: "CONCEPT_LINKING",
      topic: "Photosynthesis",
      subject: "Biology",
      educationLevel: EducationLevel.MEDIO,
      count: 5,
    };

    it("should return questions from DB if enough exist", async () => {
      const mockQuestions = Array(5).fill({ id: "1", question: {} });
      (prisma.question_bank.findMany as jest.Mock).mockResolvedValue(
        mockQuestions,
      );

      const result = await service.getQuestionsForUser(params);

      expect(result).toHaveLength(5);
      expect(prisma.question_bank.findMany).toHaveBeenCalledTimes(1);
      expect(aiGenerator.generate).not.toHaveBeenCalled();
    });

    it("should generate questions via AI if DB has insufficient questions", async () => {
      const dbQuestions = [{ id: "1", question: {} }]; // Only 1 in DB
      const aiQuestions = Array(4).fill({ question: {}, answer: {} }); // Need 4 more

      (prisma.question_bank.findMany as jest.Mock).mockResolvedValue(
        dbQuestions,
      );
      (mockAiGenerator.generate as jest.Mock).mockResolvedValue(aiQuestions);
      (prisma.question_bank.create as jest.Mock).mockImplementation((args) => ({
        id: "new",
        ...args.data,
      }));

      const result = await service.getQuestionsForUser(params);

      expect(result).toHaveLength(5); // 1 DB + 4 AI
      expect(prisma.question_bank.findMany).toHaveBeenCalled();
      expect(mockAiGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({ count: 4 }),
      );
      expect(prisma.question_bank.create).toHaveBeenCalledTimes(4);
    });

    it("should return available questions if AI fails", async () => {
      const dbQuestions = [{ id: "1", question: {} }];
      (prisma.question_bank.findMany as jest.Mock).mockResolvedValue(
        dbQuestions,
      );
      (mockAiGenerator.generate as jest.Mock).mockRejectedValue(
        new Error("AI Error"),
      );

      const result = await service.getQuestionsForUser(params);

      expect(result).toHaveLength(1);
      expect(mockAiGenerator.generate).toHaveBeenCalled();
    });
  });
});
