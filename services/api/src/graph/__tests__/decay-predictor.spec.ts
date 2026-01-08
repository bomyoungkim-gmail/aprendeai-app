import { Test, TestingModule } from '@nestjs/testing';
import { DecayPredictorService } from '../ml/decay-predictor.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DecayPredictorService', () => {
  let service: DecayPredictorService;
  let prisma: PrismaService;

  const mockPrismaService = {
    highlights: {
      count: jest.fn(),
    },
    reading_sessions: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks to ensure test isolation
    mockPrismaService.highlights.count.mockReset();
    mockPrismaService.reading_sessions.findMany.mockReset();
    mockPrismaService.$queryRaw.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecayPredictorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DecayPredictorService>(DecayPredictorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPredictedHalfLife', () => {
    it('should return default half-life for new user with no data', async () => {
      mockPrismaService.highlights.count.mockResolvedValue(0);
      mockPrismaService.reading_sessions.findMany.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ total: BigInt(0), retained: BigInt(0) }]);

      const halfLife = await service.getPredictedHalfLife('user123');

      expect(halfLife).toBeGreaterThanOrEqual(7);
      expect(halfLife).toBeLessThanOrEqual(30);
    });

    it('should predict longer half-life for active user', async () => {
      // Mock high activity
      mockPrismaService.highlights.count
        .mockResolvedValueOnce(60) // 60 highlights in 30 days = 2/day
        .mockResolvedValueOnce(100) // Total highlights
        .mockResolvedValueOnce(30); // Revisited highlights

      mockPrismaService.reading_sessions.findMany.mockResolvedValue(
        Array(20).fill(null).map(() => {
          const started = new Date('2026-01-01T10:00:00Z');
          const finished = new Date('2026-01-01T10:30:00Z'); // 30 min later
          return {
            id: 'session1',
            user_id: 'user123',
            content_id: 'content1',
            started_at: started,
            finished_at: finished,
          };
        }),
      );

      
      mockPrismaService.$queryRaw.mockResolvedValue([
        { total: BigInt(100), retained: BigInt(80) }, // 80% retention
      ]);

      try {
        const halfLife = await service.getPredictedHalfLife('user123');

        // Active user should get longer half-life
        expect(halfLife).toBeGreaterThan(14); // Above default
        expect(halfLife).toBeLessThanOrEqual(30);
      } catch (error) {
        throw error;
      }
    });

    it('should predict shorter half-life for inactive user', async () => {
      // Mock low activity
      mockPrismaService.highlights.count
        .mockResolvedValueOnce(3) // Only 3 highlights in 30 days
        .mockResolvedValueOnce(10) // Total highlights
        .mockResolvedValueOnce(1); // Few revisits
      
      mockPrismaService.$queryRaw.mockResolvedValue([
        { total: BigInt(50), retained: BigInt(15) }, // 30% retention
      ]);

      mockPrismaService.reading_sessions.findMany.mockResolvedValue(
        Array(2).fill(null).map(() => {
          const started = new Date('2026-01-01T10:00:00Z');
          const finished = new Date('2026-01-01T10:05:00Z'); // 5 min later
          return {
            started_at: started,
            finished_at: finished,
          };
        }),
      );

      mockPrismaService.$queryRaw.mockResolvedValue([
        { total: BigInt(50), retained: BigInt(15) }, // 30% retention
      ]);

      const halfLife = await service.getPredictedHalfLife('user123');

      // Inactive user should get shorter half-life
      expect(halfLife).toBeLessThan(14); // Below default
      expect(halfLife).toBeGreaterThanOrEqual(7);
    });

    it('should cache predictions', async () => {
      mockPrismaService.highlights.count.mockResolvedValue(30);
      mockPrismaService.reading_sessions.findMany.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ total: BigInt(0), retained: BigInt(0) }]);

      // First call
      await service.getPredictedHalfLife('user123');
      
      // Second call should use cache
      await service.getPredictedHalfLife('user123');

      // Should only query once set of features (3 calls to count)
      expect(mockPrismaService.highlights.count).toHaveBeenCalledTimes(3);
    });

    it('should respect min/max bounds', async () => {
      // Test with extreme values
      mockPrismaService.highlights.count
        .mockResolvedValueOnce(1000) // Extreme activity
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(1000);

      mockPrismaService.reading_sessions.findMany.mockResolvedValue(
        Array(100).fill(null).map(() => {
          const started = new Date('2026-01-01T10:00:00Z');
          const finished = new Date('2026-01-01T12:00:00Z'); // 120 min later
          return {
            started_at: started,
            finished_at: finished,
          };
        }),
      );

      mockPrismaService.$queryRaw.mockResolvedValue([
        { total: BigInt(1000), retained: BigInt(1000) }, // Perfect retention
      ]);

      const halfLife = await service.getPredictedHalfLife('user123');

      // Should not exceed max
      expect(halfLife).toBeLessThanOrEqual(30);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific user', async () => {
      mockPrismaService.highlights.count.mockResolvedValue(30);
      mockPrismaService.reading_sessions.findMany.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ total: BigInt(0), retained: BigInt(0) }]);

      await service.getPredictedHalfLife('user123');
      service.clearCache('user123');
      await service.getPredictedHalfLife('user123');

      // Should query twice (cache was cleared) - 3 calls * 2
      expect(mockPrismaService.highlights.count).toHaveBeenCalledTimes(6);
    });

    it('should clear all caches when no user specified', async () => {
      mockPrismaService.highlights.count.mockResolvedValue(30);
      mockPrismaService.reading_sessions.findMany.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ total: BigInt(0), retained: BigInt(0) }]);

      await service.getPredictedHalfLife('user1');
      await service.getPredictedHalfLife('user2');
      
      service.clearCache(); // Clear all
      
      await service.getPredictedHalfLife('user1');
      await service.getPredictedHalfLife('user2');

      // Should query 4 times total (2 before clear, 2 after) - 3 calls * 4
      expect(mockPrismaService.highlights.count).toHaveBeenCalledTimes(12);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics with features', async () => {
      mockPrismaService.highlights.count
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);

      mockPrismaService.reading_sessions.findMany.mockResolvedValue(
        Array(10).fill(null).map(() => {
          const started = new Date('2026-01-01T10:00:00Z');
          const finished = new Date('2026-01-01T10:25:00Z'); // 25 min later
          return {
            started_at: started,
            finished_at: finished,
          };
        }),
      );

      mockPrismaService.$queryRaw.mockResolvedValue([
        { total: BigInt(50), retained: BigInt(40) },
      ]);

      const stats = await service.getStatistics('user123');

      expect(stats.predictedHalfLife).toBeGreaterThanOrEqual(7);
      expect(stats.predictedHalfLife).toBeLessThanOrEqual(30);
      expect(stats.features.activityFrequency).toBe(1); // 30/30
      expect(stats.features.avgSessionDuration).toBe(25);
      expect(stats.features.retentionRate).toBe(0.8); // 40/50
      expect(stats.features.rehighlightRate).toBe(0.2); // 20/100
      expect(stats.usingDefault).toBe(false);
    });
  });
});
