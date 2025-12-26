import { Test, TestingModule } from '@nestjs/testing';
import { ContentPedagogicalService } from '../../src/cornell/services/content-pedagogical.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ContentPedagogicalService', () => {
  let service: ContentPedagogicalService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    contentPedagogicalData: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    gameResult: {
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

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createOrUpdatePedagogicalData', () => {
    it('should upsert pedagogical data with content relation', async () => {
      const contentId = 'content-123';
      const inputData: any = {
        vocabularyTriage: { words: [{ word: 'Test', definition: 'A test word' }] },
        socraticQuestions: [{ sectionId: 'intro', questions: [] }],
        content: { connect: { id: contentId } },
      };

      const mockResult = {
        id: 'ped-123',
        contentId,
        ...inputData,
        processingVersion: 'v1.0',
        processedAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.contentPedagogicalData.upsert.mockResolvedValue(mockResult);

      const result = await service.createOrUpdatePedagogicalData(contentId, inputData);

      expect(mockPrismaService.contentPedagogicalData.upsert).toHaveBeenCalledWith({
        where: { contentId },
        create: { ...inputData, contentId },
        update: inputData,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle optional fields gracefully', async () => {
      const contentId = 'content-456';
      const minimalData: any = {
        content: { connect: { id: contentId } },
      };

      mockPrismaService.contentPedagogicalData.upsert.mockResolvedValue({
        id: 'ped-456',
        contentId,
      });

      await service.createOrUpdatePedagogicalData(contentId, minimalData);

      expect(mockPrismaService.contentPedagogicalData.upsert).toHaveBeenCalled();
    });
  });

  describe('getPedagogicalData', () => {
    it('should retrieve pedagogical data for a content', async () => {
      const contentId = 'content-789';
      const mockData = {
        id: 'ped-789',
        contentId,
        vocabularyTriage: { words: [] },
        processingVersion: 'v1.0',
      };

      mockPrismaService.contentPedagogicalData.findUnique.mockResolvedValue(mockData);

      const result = await service.getPedagogicalData(contentId);

      expect(mockPrismaService.contentPedagogicalData.findUnique).toHaveBeenCalledWith({
        where: { contentId },
      });
      expect(result).toEqual(mockData);
    });

    it('should return null if no data exists', async () => {
      const contentId = 'non-existent';

      mockPrismaService.contentPedagogicalData.findUnique.mockResolvedValue(null);

      const result = await service.getPedagogicalData(contentId);

      expect(result).toBeNull();
    });
  });

  describe('recordGameResult', () => {
    it('should create a game result', async () => {
      const gameData: any = {
        gameType: 'QUIZ',
        score: 85.5,
        metadata: { weakWords: ['photosynthesis'], attemptCount: 1 },
        user: { connect: { id: 'user-123' } },
        content: { connect: { id: 'content-123' } },
      };

      const mockResult = {
        id: 'game-result-123',
        userId: 'user-123',
        contentId: 'content-123',
        ...gameData,
        playedAt: new Date(),
      };

      mockPrismaService.gameResult.create.mockResolvedValue(mockResult);

      const result = await service.recordGameResult(gameData);

      expect(mockPrismaService.gameResult.create).toHaveBeenCalledWith({
        data: gameData,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle different game types', async () => {
      const gameTypes = ['QUIZ', 'TABOO', 'BOSS_FIGHT', 'FREE_RECALL'];

      for (const gameType of gameTypes) {
        const gameData: any = {
          gameType,
          score: 100,
          user: { connect: { id: 'user-123' } },
          content: { connect: { id: 'content-123' } },
        };

        mockPrismaService.gameResult.create.mockResolvedValue({ id: 'test', ...gameData });

        await service.recordGameResult(gameData);

        expect(mockPrismaService.gameResult.create).toHaveBeenLastCalledWith({
          data: gameData,
        });
      }
    });
  });
});
