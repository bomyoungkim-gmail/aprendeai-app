import { Test, TestingModule } from "@nestjs/testing";
import { ActivityService } from "./activity.service";
import { PrismaService } from "../prisma/prisma.service";

describe("ActivityService - Active Topics", () => {
  let service: ActivityService;
  let prismaService: PrismaService;

  const mockPrisma = {
    userTopicMastery: {
      findMany: jest.fn(),
    },
    dailyActivity: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getActivityStats - activeTopics", () => {
    it("should return 0 active topics when user has no recent activity", async () => {
      mockPrisma.dailyActivity.findMany.mockResolvedValue([]);
      mockPrisma.userTopicMastery.findMany.mockResolvedValue([]);

      const stats = await service.getActivityStats("user-123");

      expect(stats.activeTopics).toBe(0);
    });

    it("should count distinct topics from last 7 days", async () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      mockPrisma.dailyActivity.findMany.mockResolvedValue([
        { date: today, minutesStudied: 60 },
      ]);

      mockPrisma.userTopicMastery.findMany.mockResolvedValue([
        { topic: "Math", lastActivityAt: today },
        { topic: "Physics", lastActivityAt: today },
        { topic: "Chemistry", lastActivityAt: sevenDaysAgo },
      ]);

      const stats = await service.getActivityStats("user-123");

      expect(stats.activeTopics).toBe(3);
      expect(mockPrisma.userTopicMastery.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          lastActivityAt: { gte: expect.any(Date) },
        },
        select: { topic: true },
        distinct: ["topic"],
      });
    });

    it("should not count old topics beyond 7 days", async () => {
      const today = new Date();
      const eightDaysAgo = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);

      mockPrisma.dailyActivity.findMany.mockResolvedValue([]);

      mockPrisma.userTopicMastery.findMany.mockResolvedValue([
        { topic: "OldTopic", lastActivityAt: eightDaysAgo },
      ]);

      const stats = await service.getActivityStats("user-123");

      // Should filter out topics older than 7 days in the query
      expect(stats.activeTopics).toBe(0);
    });
  });
});
