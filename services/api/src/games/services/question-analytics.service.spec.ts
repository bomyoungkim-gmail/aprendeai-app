import { Test, TestingModule } from '@nestjs/testing';
import { QuestionAnalyticsService } from './question-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('QuestionAnalyticsService', () => {
  let service: QuestionAnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    questionResult: {
      create: jest.fn(),
    },
    questionAnalytics: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    questionBank: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionAnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<QuestionAnalyticsService>(QuestionAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordResult', () => {
    const resultDto = {
      questionId: 'q1',
      score: 80,
      timeTaken: 30,
      isCorrect: true,
      selfRating: 2,
    };

    it('should record result and create analytics if not exists', async () => {
      (prisma.questionResult.create as jest.Mock).mockResolvedValue({ id: 'r1', ...resultDto });
      (prisma.questionAnalytics.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // First check before update
        .mockResolvedValueOnce({ // Return after update
          questionId: 'q1', 
          totalAttempts: 1, 
          avgScore: 80 
        }); 

      await service.recordResult('user1', resultDto);

      expect(prisma.questionResult.create).toHaveBeenCalled();
      expect(prisma.questionAnalytics.create).toHaveBeenCalled();
      expect(prisma.questionBank.update).toHaveBeenCalled();
    });

    it('should update existing analytics', async () => {
      (prisma.questionResult.create as jest.Mock).mockResolvedValue({ id: 'r2', ...resultDto });
      (prisma.questionAnalytics.findUnique as jest.Mock)
        .mockResolvedValueOnce({ 
          questionId: 'q1', 
          totalAttempts: 1, 
          avgScore: 50,
          avgTime: 50,
          successRate: 0 
        })
        .mockResolvedValueOnce({ // Return after update
          questionId: 'q1',
          totalAttempts: 2,
          avgScore: 65
        });

      await service.recordResult('user1', resultDto);

      expect(prisma.questionResult.create).toHaveBeenCalled();
      expect(prisma.questionAnalytics.update).toHaveBeenCalled();
      expect(prisma.questionBank.update).toHaveBeenCalled();
    });
  });
});
