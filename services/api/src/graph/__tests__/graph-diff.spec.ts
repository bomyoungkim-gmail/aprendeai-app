import { Test, TestingModule } from "@nestjs/testing";
import { GraphDiffService } from "../diff/graph-diff.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("GraphDiffService", () => {
  let service: GraphDiffService;
  let prisma: PrismaService;

  const mockPrismaService = {
    topic_graphs: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphDiffService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GraphDiffService>(GraphDiffService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateDiff", () => {
    it("should return empty diff when no graphs exist", async () => {
      mockPrismaService.topic_graphs.findMany.mockResolvedValue([]);

      const since = new Date("2026-01-01");
      const diff = await service.calculateDiff("user123", null, since);

      expect(diff.summary.nodesAdded).toBe(0);
      expect(diff.summary.nodesRemoved).toBe(0);
      expect(diff.summary.nodesStrengthened).toBe(0);
      expect(diff.summary.nodesWeakened).toBe(0);
      expect(diff.changes.added).toHaveLength(0);
    });

    it("should categorize added nodes correctly", async () => {
      const since = new Date("2026-01-07");
      const now = new Date("2026-01-08");

      mockPrismaService.topic_graphs.findMany.mockResolvedValue([
        { id: "graph1" },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValue([
        {
          id: "node1",
          graph_id: "graph1",
          label: "New Concept",
          confidence: 0.8,
          created_at: new Date("2026-01-07T10:00:00Z"), // Created after 'since'
          updated_at: new Date("2026-01-07T10:00:00Z"),
        },
      ]);

      const diff = await service.calculateDiff("user123", null, since);

      expect(diff.summary.nodesAdded).toBe(1);
      expect(diff.changes.added).toHaveLength(1);
      expect(diff.changes.added[0].label).toBe("New Concept");
      expect(diff.changes.added[0].reason).toBe("new_learning");
    });

    it("should categorize removed nodes correctly", async () => {
      const since = new Date("2026-01-07");

      mockPrismaService.topic_graphs.findMany.mockResolvedValue([
        { id: "graph1" },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValue([
        {
          id: "node1",
          graph_id: "graph1",
          label: "Forgotten Concept",
          confidence: 0.05, // Below threshold
          created_at: new Date("2026-01-01"), // Old node
          updated_at: new Date("2026-01-07T10:00:00Z"), // Updated recently
        },
      ]);

      const diff = await service.calculateDiff("user123", null, since);

      expect(diff.summary.nodesRemoved).toBe(1);
      expect(diff.changes.removed).toHaveLength(1);
      expect(diff.changes.removed[0].label).toBe("Forgotten Concept");
      expect(diff.changes.removed[0].reason).toBe("decay_below_threshold");
    });

    it("should filter by content ID when provided", async () => {
      mockPrismaService.topic_graphs.findMany.mockResolvedValue([
        { id: "graph1" },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.calculateDiff("user123", "content456", new Date());

      expect(mockPrismaService.topic_graphs.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          content_id: "content456",
        }),
        select: { id: true },
      });
    });

    it("should include period in response", async () => {
      const since = new Date("2026-01-01");
      mockPrismaService.topic_graphs.findMany.mockResolvedValue([]);

      const diff = await service.calculateDiff("user123", null, since);

      expect(diff.period.from).toEqual(since);
      expect(diff.period.to).toBeInstanceOf(Date);
    });
  });

  describe("parseRelativeTime", () => {
    it("should parse hours correctly", () => {
      const result = service.parseRelativeTime("24h");
      const now = new Date();
      const expected = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3); // Within seconds
    });

    it("should parse days correctly", () => {
      const result = service.parseRelativeTime("7d");
      const now = new Date();
      const expected = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3);
    });

    it("should parse weeks correctly", () => {
      const result = service.parseRelativeTime("2w");
      const now = new Date();
      const expected = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3);
    });

    it("should throw error for invalid format", () => {
      expect(() => service.parseRelativeTime("invalid")).toThrow();
      expect(() => service.parseRelativeTime("24x")).toThrow();
      expect(() => service.parseRelativeTime("abc")).toThrow();
    });
  });
});
