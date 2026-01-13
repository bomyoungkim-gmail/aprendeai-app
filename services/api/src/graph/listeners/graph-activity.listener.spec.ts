import { Test, TestingModule } from "@nestjs/testing";
import { GraphActivityListener } from "./graph-activity.listener";
import { PrismaService } from "../../prisma/prisma.service";
import { GraphComparatorService } from "../comparator/graph-comparator.service";

describe("GraphActivityListener", () => {
  let listener: GraphActivityListener;
  let prisma: PrismaService;
  let comparatorService: GraphComparatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphActivityListener,
        {
          provide: PrismaService,
          useValue: {
            topic_graphs: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: GraphComparatorService,
          useValue: {
            compareGraphs: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<GraphActivityListener>(GraphActivityListener);
    prisma = module.get<PrismaService>(PrismaService);
    comparatorService = module.get<GraphComparatorService>(
      GraphComparatorService,
    );
  });

  describe("handleGraphUpdate", () => {
    it("should increment activity counter", async () => {
      const payload = { userId: "user1", contentId: "content1" };

      await listener.handleGraphUpdate(payload);

      // Access private property for testing
      const counter = (listener as any).activityCounter;
      expect(counter.get("user1:content1")).toBe(1);
    });

    it("should trigger comparison when threshold reached", async () => {
      const payload = { userId: "user1", contentId: "content1" };

      // Mock graph lookup
      (prisma.topic_graphs.findFirst as jest.Mock).mockResolvedValue({
        id: "graph-id",
      });

      // Trigger 5 times to reach threshold
      for (let i = 0; i < 5; i++) {
        await listener.handleGraphUpdate(payload);
      }

      expect(comparatorService.compareGraphs).toHaveBeenCalledWith(
        "user1",
        "content1",
      );
      expect(prisma.topic_graphs.update).toHaveBeenCalled();
    });

    it("should reset counter after comparison", async () => {
      const payload = { userId: "user1", contentId: "content1" };

      (prisma.topic_graphs.findFirst as jest.Mock).mockResolvedValue({
        id: "graph-id",
      });

      // Trigger threshold
      for (let i = 0; i < 5; i++) {
        await listener.handleGraphUpdate(payload);
      }

      // Counter should be reset
      const counter = (listener as any).activityCounter;
      expect(counter.has("user1:content1")).toBe(false);
    });

    it("should handle comparison errors gracefully", async () => {
      const payload = { userId: "user1", contentId: "content1" };

      (prisma.topic_graphs.findFirst as jest.Mock).mockResolvedValue({
        id: "graph-id",
      });

      (comparatorService.compareGraphs as jest.Mock).mockRejectedValue(
        new Error("Comparison failed"),
      );

      // Should not throw
      for (let i = 0; i < 5; i++) {
        await expect(
          listener.handleGraphUpdate(payload),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("handleDailyCleanup", () => {
    it("should clear all activity counters", async () => {
      // Add some counters
      await listener.handleGraphUpdate({
        userId: "user1",
        contentId: "content1",
      });
      await listener.handleGraphUpdate({
        userId: "user2",
        contentId: "content2",
      });

      const counterBefore = (listener as any).activityCounter;
      expect(counterBefore.size).toBeGreaterThan(0);

      // Run cleanup
      await listener.handleDailyCleanup();

      const counterAfter = (listener as any).activityCounter;
      expect(counterAfter.size).toBe(0);
    });
  });
});
