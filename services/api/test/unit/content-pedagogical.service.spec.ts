import { Test, TestingModule } from "@nestjs/testing";
import { ContentPedagogicalService } from "../../src/cornell/services/content-pedagogical.service";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("ContentPedagogicalService", () => {
  let service: ContentPedagogicalService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    content_pedagogical_data: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    game_results: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentPedagogicalService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContentPedagogicalService>(ContentPedagogicalService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Service Definition", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });

  describe("createOrUpdatePedagogicalData", () => {
    it("should upsert pedagogical data with content relation", async () => {
      const contentId = "content-123";
      const inputData: any = {
        vocabularyTriage: {
          words: [{ word: "Test", definition: "A test word" }],
        },
        socraticQuestions: [{ sectionId: "intro", questions: [] }],
        content: { connect: { id: contentId } },
      };

      const mockResult = {
        id: "ped-123",
        contentId,
        ...inputData,
        processingVersion: "v1.0",
        processedAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.content_pedagogical_data.upsert.mockResolvedValue(
        mockResult,
      );

      const result = await service.createOrUpdatePedagogicalData(
        contentId,
        inputData,
      );

      expect(
        mockPrismaService.content_pedagogical_data.upsert,
      ).toHaveBeenCalledWith({
        where: { content_id: contentId },
        create: {
          ...inputData,
          content_id: contentId,
          id: expect.any(String),
          updated_at: expect.any(Date),
        },
        update: { ...inputData, updated_at: expect.any(Date) },
      });
      expect(result).toEqual(mockResult);
    });

    it("should handle optional fields gracefully", async () => {
      const contentId = "content-456";
      const minimalData: any = {
        content: { connect: { id: contentId } },
      };

      mockPrismaService.content_pedagogical_data.upsert.mockResolvedValue({
        id: "ped-456",
        contentId,
      });

      await service.createOrUpdatePedagogicalData(contentId, minimalData);

      expect(
        mockPrismaService.content_pedagogical_data.upsert,
      ).toHaveBeenCalled();
    });
  });

  describe("getPedagogicalData", () => {
    it("should retrieve pedagogical data for a content", async () => {
      const contentId = "content-789";
      const mockData = {
        id: "ped-789",
        contentId,
        vocabularyTriage: { words: [] },
        processingVersion: "v1.0",
      };

      mockPrismaService.content_pedagogical_data.findUnique.mockResolvedValue(
        mockData,
      );

      const result = await service.getPedagogicalData(contentId);

      expect(
        mockPrismaService.content_pedagogical_data.findUnique,
      ).toHaveBeenCalledWith({
        where: { content_id: contentId },
      });
      expect(result).toEqual(mockData);
    });

    it("should return null if no data exists", async () => {
      const contentId = "non-existent";

      mockPrismaService.content_pedagogical_data.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.getPedagogicalData(contentId);

      expect(result).toBeNull();
    });
  });

  describe("recordGameResult", () => {
    it("should create a game result", async () => {
      const gameData: any = {
        game_type: "QUIZ",
        score: 85.5,
        metadata: { weakWords: ["photosynthesis"], attemptCount: 1 },
        user: { connect: { id: "user-123" } },
        content: { connect: { id: "content-123" } },
      };

      const mockResult = {
        id: "game-result-123",
        user_id: "user-123",
        content_id: "content-123",
        ...gameData,
        played_at: new Date(),
      };

      mockPrismaService.game_results.create.mockResolvedValue(mockResult);

      const result = await service.recordGameResult(gameData);

      expect(mockPrismaService.game_results.create).toHaveBeenCalledWith({
        data: gameData,
      });
      expect(result).toEqual(mockResult);
    });

    it("should handle different game types", async () => {
      const gameTypes = ["QUIZ", "TABOO", "BOSS_FIGHT", "FREE_RECALL"];

      for (const gameType of gameTypes) {
        const gameData: any = {
          game_type: gameType,
          score: 100,
          user: { connect: { id: "user-123" } },
          content: { connect: { id: "content-123" } },
        };

        mockPrismaService.game_results.create.mockResolvedValue({
          id: "test",
          ...gameData,
        });

        await service.recordGameResult(gameData);

        expect(mockPrismaService.game_results.create).toHaveBeenLastCalledWith({
          data: gameData,
        });
      }
    });
  });
});
