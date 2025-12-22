import { Test, TestingModule } from '@nestjs/testing';
import { ReadingSessionsService } from './reading-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsQueryDto } from './dto/sessions-query.dto';

describe('ReadingSessionsService - Session History', () => {
  let service: ReadingSessionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    readingSession: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingSessionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        // Mock other dependencies
        { provide: 'ProfileService', useValue: {} },
        { provide: 'GamificationService', useValue: {} },
        { provide: 'VocabService', useValue: {} },
        { provide: 'OutcomesService', useValue: {} },
        { provide: 'GatingService', useValue: {} },
        { provide: 'QuickCommandParser', useValue: {} },
        { provide: 'AiServiceClient', useValue: {} },
        { provide: 'EventEmitter2', useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReadingSessionsService>(ReadingSessionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSessions', () => {
    const userId = 'user-123';
    const mockSessions = [
      {
        id: 'session-1',
        startedAt: new Date('2025-01-15T10:00:00Z'),
        finishedAt: new Date('2025-01-15T10:30:00Z'),
        phase: 'POST',
        content: {
          id: 'content-1',
          title: 'Test Article',
          type: 'ARTICLE',
        },
        _count: { events: 5 },
      },
      {
        id: 'session-2',
        startedAt: new Date('2025-01-14T15:00:00Z'),
        finishedAt: null,
        phase: 'PRE',
        content: {
          id: 'content-2',
          title: 'Another Article',
          type: 'WEB_CLIP',
        },
        _count: { events: 2 },
      },
    ];

    it('should return paginated sessions with default params', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(2);
      mockPrisma.readingSession.findMany.mockResolvedValue(mockSessions);

      const dto: SessionsQueryDto = {};
      const result = await service.getUserSessions(userId, dto);

      expect(result.sessions).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrisma.readingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should apply page and limit params', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(100);
      mockPrisma.readingSession.findMany.mockResolvedValue([]);

      const dto: SessionsQueryDto = { page: 3, limit: 10 };
      await service.getUserSessions(userId, dto);

      expect(mockPrisma.readingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        }),
      );
    });

    it('should apply date range filters', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(0);
      mockPrisma.readingSession.findMany.mockResolvedValue([]);

      const dto: SessionsQueryDto = {
        since: '2025-01-01T00:00:00Z',
        until: '2025-01-31T23:59:59Z',
      };
      await service.getUserSessions(userId, dto);

      expect(mockPrisma.readingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startedAt: {
              gte: new Date('2025-01-01T00:00:00Z'),
              lte: new Date('2025-01-31T23:59:59Z'),
            },
          }),
        }),
      );
    });

    it('should apply phase filter', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(0);
      mockPrisma.readingSession.findMany.mockResolvedValue([]);

      const dto: SessionsQueryDto = { phase: 'PRE' };
      await service.getUserSessions(userId, dto);

      expect(mockPrisma.readingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phase: 'PRE',
          }),
        }),
      );
    });

    it('should apply search query', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(0);
      mockPrisma.readingSession.findMany.mockResolvedValue([]);

      const dto: SessionsQueryDto = { query: 'test search' };
      await service.getUserSessions(userId, dto);

      expect(mockPrisma.readingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            content: {
              title: { contains: 'test search', mode: 'insensitive' },
            },
          }),
        }),
      );
    });

    it('should respect max limit of 100', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(0);
      mockPrisma.readingSession.findMany.mockResolvedValue([]);

      const dto: SessionsQueryDto = { limit: 500 };
      await service.getUserSessions(userId, dto);

      expect(mockPrisma.readingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('should transform sessions with duration calculation', async () => {
      mockPrisma.readingSession.count.mockResolvedValue(2);
      mockPrisma.readingSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.getUserSessions(userId, {});

      expect(result.sessions[0]).toMatchObject({
        id: 'session-1',
        duration: 30, // 30 minutes
        eventsCount: 5,
      });
      expect(result.sessions[1]).toMatchObject({
        id: 'session-2',
        duration: null, // Not finished
        eventsCount: 2,
      });
    });
  });

  describe('exportSessions', () => {
    const userId = 'user-123';
    const mockSessions = [
      {
        id: 'session-1',
        startedAt: new Date('2025-01-15T10:00:00Z'),
        finishedAt: new Date('2025-01-15T10:30:00Z'),
        phase: 'POST',
        content: { id: 'c1', title: 'Test', type: 'ARTICLE' },
        _count: { events: 5 },
      },
    ];

    it('should export as JSON', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.exportSessions(userId, 'json');

      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('startedAt');
    });

    it('should export as CSV with proper format', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.exportSessions(userId, 'csv');

      expect(result.csv).toContain('ID,Started At,Finished At');
      expect(result.csv).toContain('"session-1"');
      expect(result.csv).toContain('"Test"');
      expect(result.count).toBe(1);
    });
  });

  describe('getActivityAnalytics', () => {
    const userId = 'user-123';

    it('should return activity grouped by date', async () => {
      const mockSessions = [
        {
          startedAt: new Date('2025-01-15T10:00:00Z'),
          finishedAt: new Date('2025-01-15T10:30:00Z'),
          phase: 'PRE',
        },
        {
          startedAt: new Date('2025-01-15T15:00:00Z'),
          finishedAt: new Date('2025-01-15T15:45:00Z'),
          phase: 'POST',
        },
        {
          startedAt: new Date('2025-01-16T09:00:00Z'),
          finishedAt: null,
          phase: 'DURING',
        },
      ];

      mockPrisma.readingSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.getActivityAnalytics(userId, 30);

      expect(result.totalSessions).toBe(3);
      expect(result.periodDays).toBe(30);
      expect(result.activityByDate['2025-01-15']).toEqual({
        count: 2,
        minutes: 75, // 30 + 45
      });
      expect(result.activityByDate['2025-01-16']).toEqual({
        count: 1,
        minutes: 0, // Not finished
      });
    });

    it('should return phase distribution', async () => {
      const mockSessions = [
        { startedAt: new Date(), finishedAt: null, phase: 'PRE' },
        { startedAt: new Date(), finishedAt: null, phase: 'PRE' },
        { startedAt: new Date(), finishedAt: null, phase: 'DURING' },
        { startedAt: new Date(), finishedAt: null, phase: 'POST' },
        { startedAt: new Date(), finishedAt: null, phase: 'POST' },
        { startedAt: new Date(), finishedAt: null, phase: 'POST' },
      ];

      mockPrisma.readingSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.getActivityAnalytics(userId, 7);

      expect(result.phaseDistribution).toEqual({
        PRE: 2,
        DURING: 1,
        POST: 3,
      });
    });
  });
});
