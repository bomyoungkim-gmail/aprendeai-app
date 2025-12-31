import { Test, TestingModule } from "@nestjs/testing";
import { ContentPedagogicalService } from "../../src/cornell/services/content-pedagogical.service";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("ContentPedagogicalService", () => {
  let service: ContentPedagogicalService;

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
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ContentPedagogicalService>(ContentPedagogicalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createOrUpdatePedagogicalData", () => {
    it("should upsert pedagogical data", async () => {
      const contentId = "content-123";
      const inputData: any = {
        vocabulary_triage: { words: [] },
      };

      await service.createOrUpdatePedagogicalData(contentId, inputData);

      expect(
        mockPrismaService.content_pedagogical_data.upsert,
      ).toHaveBeenCalledWith({
        where: { content_id: contentId },
        create: expect.objectContaining({
          ...inputData,
          content_id: contentId,
        }),
        update: expect.objectContaining({
          ...inputData,
        }),
      });
    });
  });

  describe("recordGameResult", () => {
    it("should create a game result", async () => {
      const gameData: any = {
        game_type: "QUIZ",
        score: 100,
        user_id: "user-123",
        content_id: "content-123",
      };

      await service.recordGameResult(gameData);

      expect(mockPrismaService.game_results.create).toHaveBeenCalledWith({
        data: gameData,
      });
    });
  });
});
