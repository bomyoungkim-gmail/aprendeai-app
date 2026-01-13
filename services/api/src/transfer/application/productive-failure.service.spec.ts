import { Test, TestingModule } from "@nestjs/testing";
import { ProductiveFailureService } from "./productive-failure.service";
import { PrismaService } from "../../prisma/prisma.service";
import { DecisionService } from "../../decision/application/decision.service";
import { NotFoundException } from "@nestjs/common";

describe("ProductiveFailureService", () => {
  let service: ProductiveFailureService;
  let prisma: PrismaService;
  let decisionService: DecisionService;

  const mockPrisma = {
    transfer_missions: {
      findFirst: jest.fn(),
    },
    transfer_attempts: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockDecisionService = {
    evaluateExtractionPolicy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductiveFailureService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: DecisionService,
          useValue: mockDecisionService,
        },
      ],
    }).compile();

    service = module.get<ProductiveFailureService>(ProductiveFailureService);
    prisma = module.get<PrismaService>(PrismaService);
    decisionService = module.get<DecisionService>(DecisionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("assignGenericPF", () => {
    it("should assign a PF mission successfully", async () => {
      const userId = "user_123";
      const contentId = "content_456";
      const mockMission = {
        id: "mission_pf_global",
        type: "PRODUCTIVE_FAILURE",
        scope_type: "GLOBAL",
      };
      const mockAttempt = {
        id: "attempt_789",
        user_id: userId,
        content_id: contentId,
        mission_id: mockMission.id,
        status: "PENDING",
      };

      mockPrisma.transfer_missions.findFirst.mockResolvedValue(mockMission);
      mockPrisma.transfer_attempts.create.mockResolvedValue(mockAttempt);

      const result = await service.assignGenericPF(userId, contentId);

      expect(result).toBe(mockAttempt.id);
      expect(mockPrisma.transfer_missions.findFirst).toHaveBeenCalledWith({
        where: {
          type: "PRODUCTIVE_FAILURE",
          scope_type: "GLOBAL",
        },
      });
      expect(mockPrisma.transfer_attempts.create).toHaveBeenCalled();
    });

    it("should throw NotFoundException if PF mission template not found", async () => {
      mockPrisma.transfer_missions.findFirst.mockResolvedValue(null);

      await expect(
        service.assignGenericPF("user_123", "content_456"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("submitPFResponse", () => {
    it("should submit response successfully", async () => {
      const attemptId = "attempt_789";
      const responseText = "My attempt at solving the problem";
      const mockAttempt = {
        id: attemptId,
        status: "PENDING",
      };

      mockPrisma.transfer_attempts.findUnique.mockResolvedValue(mockAttempt);
      mockPrisma.transfer_attempts.update.mockResolvedValue({
        ...mockAttempt,
        response_text: responseText,
      });

      await service.submitPFResponse(attemptId, responseText);

      expect(mockPrisma.transfer_attempts.update).toHaveBeenCalledWith({
        where: { id: attemptId },
        data: {
          response_text: responseText,
          updated_at: expect.any(Date),
        },
      });
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrisma.transfer_attempts.findUnique.mockResolvedValue(null);

      await expect(
        service.submitPFResponse("attempt_789", "response"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error if attempt is not in PENDING status", async () => {
      mockPrisma.transfer_attempts.findUnique.mockResolvedValue({
        id: "attempt_789",
        status: "COMPLETED",
      });

      await expect(
        service.submitPFResponse("attempt_789", "response"),
      ).rejects.toThrow("Attempt attempt_789 is not in PENDING status");
    });
  });

  describe("generateFeedback", () => {
    it("should generate deterministic feedback when hints are available", async () => {
      const attemptId = "attempt_789";
      const mockAttempt = {
        id: attemptId,
        response_text: "My response without key concepts",
        user_id: "user_123",
        content_id: "content_456",
        contents: {
          section_transfer_metadata: [
            {
              concept_json: { main_idea: "photosynthesis" },
              tools_json: { cues: ["What is the process?"] },
            },
          ],
        },
        users: { id: "user_123" },
      };

      mockPrisma.transfer_attempts.findUnique.mockResolvedValue(mockAttempt);
      mockPrisma.transfer_attempts.update.mockResolvedValue(mockAttempt);

      const result = await service.generateFeedback(attemptId);

      expect(result.feedbackType).toBe("deterministic");
      expect(result.hints).toBeDefined();
      expect(result.hints!.length).toBeGreaterThan(0);
      expect(mockPrisma.transfer_attempts.update).toHaveBeenCalled();
    });

    it("should fall back to LLM feedback when policy allows", async () => {
      const attemptId = "attempt_789";
      const mockAttempt = {
        id: attemptId,
        response_text: "My complete response with all concepts",
        user_id: "user_123",
        content_id: "content_456",
        contents: {
          section_transfer_metadata: [],
        },
        users: { id: "user_123" },
      };

      mockPrisma.transfer_attempts.findUnique.mockResolvedValue(mockAttempt);
      mockPrisma.transfer_attempts.update.mockResolvedValue(mockAttempt);
      mockDecisionService.evaluateExtractionPolicy.mockResolvedValue({
        allowed: true,
        caps: { maxTokens: 1000, modelTier: "flash" },
      });

      const result = await service.generateFeedback(attemptId);

      expect(result.feedbackType).toBe("llm");
      expect(mockDecisionService.evaluateExtractionPolicy).toHaveBeenCalled();
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrisma.transfer_attempts.findUnique.mockResolvedValue(null);

      await expect(service.generateFeedback("attempt_789")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
