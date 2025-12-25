import { Test, TestingModule } from '@nestjs/testing';
import { ProviderUsageService } from '../../src/observability/provider-usage.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProviderUsageService', () => {
  let service: ProviderUsageService;
  let prisma: PrismaService;

  const mockPrismaService = {
    providerUsage: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    familyMember: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderUsageService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProviderUsageService>(ProviderUsageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackUsage', () => {
    it('should track usage with granular token data', async () => {
      const usageData = {
        provider: 'educator_agent',
        operation: 'turn',
        tokens: 100,
        promptTokens: 60,
        completionTokens: 40,
        costUsd: 0.001,
        userId: 'user-123',
        familyId: 'family-456',
        feature: 'educator_chat',
        metadata: { sessionId: 'session-789' },
      };

      mockPrismaService.providerUsage.create.mockResolvedValue({
        id: 'usage-1',
        ...usageData,
        timestamp: new Date(),
      });

      await service.trackUsage(usageData);

      expect(mockPrismaService.providerUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'educator_agent',
          operation: 'turn',
          promptTokens: 60,
          completionTokens: 40,
          totalTokens: 100,
          costUsd: 0.001,
          userId: 'user-123',
          familyId: 'family-456',
          feature: 'educator_chat',
        }),
      });
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalData = {
        provider: 'test-provider',
        operation: 'test-op',
        tokens: 50,
      };

      mockPrismaService.providerUsage.create.mockResolvedValue({
        id: 'usage-2',
        ...minimalData,
        timestamp: new Date(),
      });

      await service.trackUsage(minimalData);

      expect(mockPrismaService.providerUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'test-provider',
          operation: 'test-op',
          feature: 'unknown', // Default value
        }),
      });
    });

    it('should not throw on database error', async () => {
      mockPrismaService.providerUsage.create.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(
        service.trackUsage({
          provider: 'test',
          operation: 'test',
          tokens: 10,
        }),
      ).resolves.not.toThrow();
    });

    it('should map costUsd correctly when only costUsd is provided', async () => {
      const data = {
        provider: 'openai',
        operation: 'completion',
        tokens: 100,
        costUsd: 0.005,
      };

      mockPrismaService.providerUsage.create.mockResolvedValue({
        id: 'usage-3',
        ...data,
      });

      await service.trackUsage(data);

      expect(mockPrismaService.providerUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          costUsd: 0.005,
        }),
      });
    });
  });

  describe('getUsageStats', () => {
    it('should return aggregated statistics', async () => {
      const from = new Date('2025-12-01');
      const to = new Date('2025-12-31');

      mockPrismaService.providerUsage.aggregate.mockResolvedValue({
        _count: 10,
        _sum: { tokens: 1000, costUsd: 0.05 },
        _avg: { latency: 1200, costUsd: 0.005 },
      });

      const stats = await service.getUsageStats({ from, to });

      expect(stats).toEqual({
        totalCalls: 10,
        totalTokens: 1000,
        totalCost: 0.05,
        avgLatency: 1200,
        avgCost: 0.005,
      });

      expect(mockPrismaService.providerUsage.aggregate).toHaveBeenCalledWith({
        where: { timestamp: { gte: from, lte: to } },
        _sum: { tokens: true, costUsd: true },
        _count: true,
        _avg: { latency: true, costUsd: true },
      });
    });

    it('should handle null values in aggregation', async () => {
      mockPrismaService.providerUsage.aggregate.mockResolvedValue({
        _count: 5,
        _sum: { tokens: null, costUsd: null },
        _avg: { latency: null, costUsd: null },
      });

      const stats = await service.getUsageStats({
        from: new Date(),
        to: new Date(),
      });

      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.avgLatency).toBe(0);
      expect(stats.avgCost).toBe(0);
    });

    it('should filter by provider when specified', async () => {
      const from = new Date('2025-12-01');
      const to = new Date('2025-12-31');

      mockPrismaService.providerUsage.aggregate.mockResolvedValue({
        _count: 3,
        _sum: { tokens: 300, costUsd: 0.03 },
        _avg: { latency: 1000, costUsd: 0.01 },
      });

      await service.getUsageStats({
        provider: 'openai',
        from,
        to,
      });

      expect(mockPrismaService.providerUsage.aggregate).toHaveBeenCalledWith({
        where: {
          timestamp: { gte: from, lte: to },
          provider: 'openai',
        },
        _sum: { tokens: true, costUsd: true },
        _count: true,
        _avg: { latency: true, costUsd: true },
      });
    });
  });

  describe('getUsageByProvider', () => {
    it('should group usage by provider', async () => {
      const mockUsageData = [
        {
          provider: 'openai',
          operation: 'completion',
          tokens: 100,
          costUsd: 0.01,
          latency: 1000,
        },
        {
          provider: 'openai',
          operation: 'completion',
          tokens: 150,
          costUsd: 0.015,
          latency: 1200,
        },
        {
          provider: 'anthropic',
          operation: 'completion',
         tokens: 200,
          costUsd: 0.02,
          latency: 1100,
        },
      ];

      mockPrismaService.providerUsage.findMany.mockResolvedValue(
        mockUsageData,
      );

      const result = await service.getUsageByProvider(
        new Date('2025-12-01'),
        new Date('2025-12-31'),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        provider: 'openai',
        calls: 2,
        tokens: 250,
      });
      expect(result[1]).toMatchObject({
        provider: 'anthropic',
        calls: 1,
        tokens: 200,
      });
    });
  });
});
