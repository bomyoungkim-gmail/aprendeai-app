import { Test, TestingModule } from "@nestjs/testing";
import { GraphDecayService } from "./graph-decay.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("GraphDecayService", () => {
  let service: GraphDecayService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphDecayService,
        {
          provide: PrismaService,
          useValue: {
            $executeRaw: jest.fn(),
            topic_nodes: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GraphDecayService>(GraphDecayService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("calculateDecay", () => {
    it("should return original confidence if lastReinforcedAt is null", () => {
      const result = service.calculateDecay(0.8, null);
      expect(result).toBe(0.8);
    });

    it("should apply exponential decay formula correctly", () => {
      const currentConfidence = 0.8;
      const halfLifeDays = 14;

      // 14 days ago (exactly 1 half-life)
      const lastReinforced = new Date();
      lastReinforced.setDate(lastReinforced.getDate() - halfLifeDays);

      const result = service.calculateDecay(currentConfidence, lastReinforced);

      // After 1 half-life, confidence should be halved
      expect(result).toBeCloseTo(0.4, 2);
    });

    it("should apply minimum confidence floor", () => {
      const currentConfidence = 0.3;
      const minConfidence = 0.2;

      // 100 days ago (very old)
      const lastReinforced = new Date();
      lastReinforced.setDate(lastReinforced.getDate() - 100);

      const result = service.calculateDecay(currentConfidence, lastReinforced);

      // Should not go below minimum
      expect(result).toBeGreaterThanOrEqual(minConfidence);
    });

    it("should decay to approximately 0.25 after 2 half-lives", () => {
      const currentConfidence = 1.0;
      const halfLifeDays = 14;

      // 28 days ago (2 half-lives)
      const lastReinforced = new Date();
      lastReinforced.setDate(lastReinforced.getDate() - halfLifeDays * 2);

      const result = service.calculateDecay(currentConfidence, lastReinforced);

      // After 2 half-lives: 1.0 * (0.5)^2 = 0.25
      expect(result).toBeCloseTo(0.25, 2);
    });

    it("should barely decay if reinforced recently", () => {
      const currentConfidence = 0.8;

      // 1 day ago
      const lastReinforced = new Date();
      lastReinforced.setDate(lastReinforced.getDate() - 1);

      const result = service.calculateDecay(currentConfidence, lastReinforced);

      // Should be very close to original
      expect(result).toBeGreaterThan(0.75);
      expect(result).toBeLessThanOrEqual(0.8);
    });
  });

  describe("reinforceNode", () => {
    it("should update node confidence and last_reinforced_at", async () => {
      const nodeId = "test-node-id";
      const currentConfidence = 0.5;
      const boostAmount = 0.1;

      (prisma.topic_nodes.findUnique as jest.Mock).mockResolvedValue({
        confidence: currentConfidence,
      });

      (prisma.topic_nodes.update as jest.Mock).mockResolvedValue({});

      await service.reinforceNode(nodeId, boostAmount);

      expect(prisma.topic_nodes.update).toHaveBeenCalledWith({
        where: { id: nodeId },
        data: {
          confidence: 0.6,
          last_reinforced_at: expect.any(Date),
        },
      });
    });

    it("should cap confidence at 1.0", async () => {
      const nodeId = "test-node-id";
      const currentConfidence = 0.95;
      const boostAmount = 0.1;

      (prisma.topic_nodes.findUnique as jest.Mock).mockResolvedValue({
        confidence: currentConfidence,
      });

      (prisma.topic_nodes.update as jest.Mock).mockResolvedValue({});

      await service.reinforceNode(nodeId, boostAmount);

      expect(prisma.topic_nodes.update).toHaveBeenCalledWith({
        where: { id: nodeId },
        data: {
          confidence: 1.0, // Capped at max
          last_reinforced_at: expect.any(Date),
        },
      });
    });

    it("should handle missing node gracefully", async () => {
      const nodeId = "non-existent-node";

      (prisma.topic_nodes.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.reinforceNode(nodeId, 0.1)).resolves.not.toThrow();
      expect(prisma.topic_nodes.update).not.toHaveBeenCalled();
    });
  });

  describe("applyBulkDecay", () => {
    it("should execute raw SQL query and return affected rows", async () => {
      const affectedRows = 150;
      (prisma.$executeRaw as jest.Mock).mockResolvedValue(affectedRows);

      const result = await service.applyBulkDecay();

      expect(result).toBe(affectedRows);
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it("should handle SQL errors gracefully", async () => {
      const error = new Error("Database connection failed");
      (prisma.$executeRaw as jest.Mock).mockRejectedValue(error);

      await expect(service.applyBulkDecay()).rejects.toThrow(error);
    });
  });

  describe("configuration validation", () => {
    it("should throw error if HALF_LIFE_DAYS is invalid", () => {
      // Set invalid env var
      process.env.GRAPH_DECAY_HALF_LIFE = "0";

      expect(() => {
        new GraphDecayService(prisma);
      }).toThrow("GRAPH_DECAY_HALF_LIFE must be greater than 0");

      // Cleanup
      delete process.env.GRAPH_DECAY_HALF_LIFE;
    });

    it("should throw error if MIN_CONFIDENCE is out of range", () => {
      // Set invalid env var
      process.env.GRAPH_MIN_CONFIDENCE = "1.5";

      expect(() => {
        new GraphDecayService(prisma);
      }).toThrow("GRAPH_MIN_CONFIDENCE must be between 0 and 1");

      // Cleanup
      delete process.env.GRAPH_MIN_CONFIDENCE;
    });
  });
});
