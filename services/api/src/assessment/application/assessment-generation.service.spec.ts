import { Test, TestingModule } from "@nestjs/testing";
import { AssessmentGenerationService } from "./assessment-generation.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("AssessmentGenerationService", () => {
  let service: AssessmentGenerationService;
  let prisma: PrismaService;

  const mockPrisma = {
    content_versions: {
      findUnique: jest.fn(),
    },
    assessments: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    assessment_questions: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentGenerationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AssessmentGenerationService>(
      AssessmentGenerationService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateFromAssets", () => {
    it("should generate assessment from quiz_post_json successfully", async () => {
      const contentVersionId = "cv_123";
      const mockContentVersion = {
        id: contentVersionId,
        content_id: "content_456",
        contents: {
          learning_assets: [
            {
              quiz_post_json: {
                questions: [
                  {
                    type: "MULTIPLE_CHOICE",
                    question: "What is the answer?",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: "B",
                    skills: ["comprehension"],
                  },
                ],
              },
              checkpoints_json: null,
            },
          ],
        },
      };
      const mockAssessment = {
        id: "assessment_789",
        content_id: "content_456",
        content_version_id: contentVersionId,
      };

      mockPrisma.content_versions.findUnique.mockResolvedValue(
        mockContentVersion,
      );
      mockPrisma.assessments.findFirst.mockResolvedValue(null);
      mockPrisma.assessments.create.mockResolvedValue(mockAssessment);
      mockPrisma.assessment_questions.create.mockResolvedValue({
        id: "q_1",
        assessment_id: mockAssessment.id,
      });

      const result = await service.generateFromAssets(contentVersionId);

      expect(result).toBe(mockAssessment.id);
      expect(mockPrisma.assessments.create).toHaveBeenCalled();
      expect(mockPrisma.assessment_questions.create).toHaveBeenCalledTimes(1);
    });

    it("should return existing assessment if already exists", async () => {
      const contentVersionId = "cv_123";
      const mockContentVersion = {
        id: contentVersionId,
        content_id: "content_456",
        contents: {
          learning_assets: [
            {
              quiz_post_json: {
                questions: [
                  {
                    type: "MULTIPLE_CHOICE",
                    question: "Test question",
                    correctAnswer: "A",
                  },
                ],
              },
            },
          ],
        },
      };
      const existingAssessment = {
        id: "existing_assessment_789",
        content_id: "content_456",
        content_version_id: contentVersionId,
      };

      mockPrisma.content_versions.findUnique.mockResolvedValue(
        mockContentVersion,
      );
      mockPrisma.assessments.findFirst.mockResolvedValue(existingAssessment);

      const result = await service.generateFromAssets(contentVersionId);

      expect(result).toBe(existingAssessment.id);
      expect(mockPrisma.assessments.create).not.toHaveBeenCalled();
    });

    it("should fall back to checkpoints_json if quiz_post_json is null", async () => {
      const contentVersionId = "cv_123";
      const mockContentVersion = {
        id: contentVersionId,
        content_id: "content_456",
        contents: {
          learning_assets: [
            {
              quiz_post_json: null,
              checkpoints_json: {
                checkpoints: [
                  {
                    question: "Checkpoint question",
                    answer: "Answer",
                  },
                ],
              },
            },
          ],
        },
      };
      const mockAssessment = {
        id: "assessment_789",
        content_id: "content_456",
        content_version_id: contentVersionId,
      };

      mockPrisma.content_versions.findUnique.mockResolvedValue(
        mockContentVersion,
      );
      mockPrisma.assessments.findFirst.mockResolvedValue(null);
      mockPrisma.assessments.create.mockResolvedValue(mockAssessment);
      mockPrisma.assessment_questions.create.mockResolvedValue({
        id: "q_1",
        assessment_id: mockAssessment.id,
      });

      const result = await service.generateFromAssets(contentVersionId);

      expect(result).toBe(mockAssessment.id);
      expect(mockPrisma.assessment_questions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            question_type: "MULTIPLE_CHOICE", // Default for checkpoints
          }),
        }),
      );
    });

    it("should throw NotFoundException if content version not found", async () => {
      mockPrisma.content_versions.findUnique.mockResolvedValue(null);

      await expect(service.generateFromAssets("cv_123")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if no learning assets found", async () => {
      const mockContentVersion = {
        id: "cv_123",
        content_id: "content_456",
        contents: {
          learning_assets: [],
        },
      };

      mockPrisma.content_versions.findUnique.mockResolvedValue(
        mockContentVersion,
      );

      await expect(service.generateFromAssets("cv_123")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw error if no valid questions found", async () => {
      const mockContentVersion = {
        id: "cv_123",
        content_id: "content_456",
        contents: {
          learning_assets: [
            {
              quiz_post_json: { questions: [] },
              checkpoints_json: null,
            },
          ],
        },
      };

      mockPrisma.content_versions.findUnique.mockResolvedValue(
        mockContentVersion,
      );

      await expect(service.generateFromAssets("cv_123")).rejects.toThrow(
        "No valid questions found in learning assets",
      );
    });
  });
});
