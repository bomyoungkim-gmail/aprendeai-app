import { Test, TestingModule } from "@nestjs/testing";
import { ThresholdOptimizerService } from "../adaptive/threshold-optimizer.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("ThresholdOptimizerService", () => {
  let service: ThresholdOptimizerService;
  let prisma: PrismaService;

  const mockPrismaService = {
    graph_comparison_outcomes: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    mockPrismaService.graph_comparison_outcomes.create.mockClear();
    mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue([]); // Default to empty
    // Or mockReset() and redefine default if needed. mockClear clears calls.
    // If I use mockResolvedValue in specific tests, better use a fresh mock or Reset.

    // Let's rely on individual tests setting what they need, but default is empty array for findMany.
    mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThresholdOptimizerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ThresholdOptimizerService>(ThresholdOptimizerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getThreshold", () => {
    it("should return default threshold for new user", async () => {
      const threshold = await service.getThreshold("user123");
      expect(threshold).toBe(5); // Default
    });

    it("should return updated threshold after adjustment", async () => {
      // Manually set threshold using private method
      service["thresholds"].set("user123", 7);

      const threshold = await service.getThreshold("user123");
      expect(threshold).toBe(7);
    });
  });

  describe("recordComparisonOutcome", () => {
    it("should record outcome in database", async () => {
      await service.recordComparisonOutcome("user123", true);

      expect(
        mockPrismaService.graph_comparison_outcomes.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: "user123",
          had_changes: true,
        }),
      });
    });

    it("should not throw on database error", async () => {
      mockPrismaService.graph_comparison_outcomes.create.mockRejectedValueOnce(
        new Error("DB error"),
      );

      // Should not throw - best effort
      await expect(
        service.recordComparisonOutcome("user123", true),
      ).resolves.not.toThrow();
    });
  });

  describe("threshold adjustment logic", () => {
    it("should increase threshold when change rate is low (<30%)", async () => {
      // Mock 10 comparisons with only 2 changes (20% change rate)
      const outcomes = Array(10)
        .fill(null)
        .map((_, i) => ({
          user_id: "user123",
          had_changes: i < 2, // Only first 2 had changes
          recorded_at: new Date(),
        }));

      mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue(
        outcomes,
      );

      // Record 10th outcome to trigger adjustment
      await service.recordComparisonOutcome("user123", false);

      // Threshold should increase from 5 to 6
      const newThreshold = await service.getThreshold("user123");
      expect(newThreshold).toBe(6);
    });

    it("should decrease threshold when change rate is high (>70%)", async () => {
      // Mock 10 comparisons with 8 changes (80% change rate)
      const outcomes = Array(10)
        .fill(null)
        .map((_, i) => ({
          user_id: "user123",
          had_changes: i < 8, // First 8 had changes
          recorded_at: new Date(),
        }));

      mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue(
        outcomes,
      );

      await service.recordComparisonOutcome("user123", true);

      // Threshold should decrease from 5 to 4
      const newThreshold = await service.getThreshold("user123");
      expect(newThreshold).toBe(4);
    });

    it("should not adjust threshold with insufficient data (<10 comparisons)", async () => {
      // Mock only 5 comparisons
      const outcomes = Array(5)
        .fill(null)
        .map(() => ({
          user_id: "user123",
          had_changes: true,
          recorded_at: new Date(),
        }));

      mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue(
        outcomes,
      );

      await service.recordComparisonOutcome("user123", true);

      // Threshold should remain at default
      const threshold = await service.getThreshold("user123");
      expect(threshold).toBe(5);
    });

    it("should respect minimum threshold of 3", async () => {
      // Set threshold to 3
      service["thresholds"].set("user123", 3);

      // Mock high change rate to trigger decrease
      const outcomes = Array(10)
        .fill(null)
        .map(() => ({
          user_id: "user123",
          had_changes: true,
          recorded_at: new Date(),
        }));

      mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue(
        outcomes,
      );

      await service.recordComparisonOutcome("user123", true);

      // Should not go below 3
      const threshold = await service.getThreshold("user123");
      expect(threshold).toBe(3);
    });

    it("should respect maximum threshold of 10", async () => {
      // Set threshold to 10
      service["thresholds"].set("user123", 10);

      // Mock low change rate to trigger increase
      const outcomes = Array(10)
        .fill(null)
        .map(() => ({
          user_id: "user123",
          had_changes: false,
          recorded_at: new Date(),
        }));

      mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue(
        outcomes,
      );

      await service.recordComparisonOutcome("user123", false);

      // Should not go above 10
      const threshold = await service.getThreshold("user123");
      expect(threshold).toBe(10);
    });
  });

  describe("getStatistics", () => {
    it("should return statistics for user", async () => {
      const outcomes = Array(15)
        .fill(null)
        .map((_, i) => ({
          user_id: "user123",
          had_changes: i < 10, // 10 out of 15 had changes
          recorded_at: new Date(),
        }));

      mockPrismaService.graph_comparison_outcomes.findMany.mockResolvedValue(
        outcomes,
      );

      const stats = await service.getStatistics("user123");

      expect(stats.currentThreshold).toBe(5);
      expect(stats.recentComparisons).toBe(15);
      expect(stats.changeRate).toBeCloseTo(10 / 15, 2);
    });
  });
});
