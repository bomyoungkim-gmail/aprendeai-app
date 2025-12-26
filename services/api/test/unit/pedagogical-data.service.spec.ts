
import { Test, TestingModule } from '@nestjs/testing';
import { ContentPedagogicalService } from '../../src/cornell/services/content-pedagogical.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const mockPrismaService = {
  contentPedagogicalData: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  gameResult: {
    create: jest.fn(),
  },
};

describe('ContentPedagogicalService', () => {
  let service: ContentPedagogicalService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentPedagogicalService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ContentPedagogicalService>(ContentPedagogicalService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdatePedagogicalData', () => {
    it('should upsert pedagogical data', async () => {
      const contentId = 'content-123';
      const inputData: any = {
        vocabularyTriage: { words: [] },
        content: { connect: { id: contentId } } // Mock relation
      };

      await service.createOrUpdatePedagogicalData(contentId, inputData);

      expect(prisma.contentPedagogicalData.upsert).toHaveBeenCalledWith({
        where: { contentId },
        create: { ...inputData, contentId },
        update: inputData,
      });
    });
  });

  describe('recordGameResult', () => {
    it('should create a game result', async () => {
      const gameData: any = {
        gameType: 'QUIZ',
        score: 100,
        userId: 'user-123',
        contentId: 'content-123',
      };

      await service.recordGameResult(gameData);

      expect(prisma.gameResult.create).toHaveBeenCalledWith({
        data: gameData,
      });
    });
  });
});
