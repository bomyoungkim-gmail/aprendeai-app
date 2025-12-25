import { Test, TestingModule } from '@nestjs/testing';
import { SessionTrackingService } from './session-tracking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionTrackingService', () => {
  let service: SessionTrackingService;
  let prismaService: PrismaService;

  const mockPrisma = {
    studySession: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionTrackingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SessionTrackingService>(SessionTrackingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSessionStart', () => {
    it('should create a new study session', async () => {
      const event = {
        userId: 'user-123',
        activityType: 'game' as const,
        contentId: 'content-456',
      };

      const mockSession = {
        id: 'session-789',
        userId: event.userId,
        activityType: event.activityType,
        startTime: new Date(),
      };

      mockPrisma.studySession.create.mockResolvedValue(mockSession);

      const result = await service.handleSessionStart(event);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.studySession.create).toHaveBeenCalledWith({
        data: {
          userId: event.userId,
          activityType: event.activityType,
          contentId: event.contentId,
          sourceId: undefined,
          startTime: expect.any(Date),
        },
      });
    });
  });

  describe('handleSessionFinish', () => {
    it('should update session with duration and metrics', async () => {
      const event = {
        sessionId: 'session-789',
        durationMinutes: 60,
        netFocusMinutes: 40,
        accuracyRate: 85,
      };

      const mockUpdate = {
        id: event.sessionId,
        endTime: new Date(),
        durationMinutes: 60,
        netFocusMinutes: 40,
        focusScore: 66.67, // (40/60)*100
        accuracyRate: 85,
      };

      mockPrisma.studySession.update.mockResolvedValue(mockUpdate);

      await service.handleSessionFinish(event);

      expect(mockPrisma.studySession.update).toHaveBeenCalledWith({
        where: { id: event.sessionId },
        data: {
          endTime: expect.any(Date),
          durationMinutes: 60,
          netFocusMinutes: 40,
          interruptions: undefined,
          focusScore: expect.closeTo(66.67, 1),
          accuracyRate: 85,
          engagementScore: undefined,
        },
      });
    });

    it('should calculate focus score correctly', async () => {
      const event = {
        sessionId: 'session-123',
        durationMinutes: 100,
        netFocusMinutes: 25,
      };

      mockPrisma.studySession.update.mockResolvedValue({});

      await service.handleSessionFinish(event);

      const call = mockPrisma.studySession.update.mock.calls[0][0];
      expect(call.data.focusScore).toBeCloseTo(25, 1); // 25/100 * 100 = 25%
    });

    it('should handle zero duration gracefully', async () => {
      const event = {
        sessionId: 'session-123',
        durationMinutes: 0,
        netFocusMinutes: 0,
      };

      mockPrisma.studySession.update.mockResolvedValue({});

      await service.handleSessionFinish(event);

      const call = mockPrisma.studySession.update.mock.calls[0][0];
      expect(call.data.focusScore).toBeUndefined(); // Avoid division by zero
    });
  });

  describe('handleSessionHeartbeat', () => {
    it('should increment interruptions on blur status', async () => {
      const event = {
        sessionId: 'session-123',
        status: 'blurred' as const,
      };

      mockPrisma.studySession.update.mockResolvedValue({});

      await service.handleSessionHeartbeat(event);

      expect(mockPrisma.studySession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          interruptions: { increment: 1 },
        },
      });
    });

    it('should not increment interruptions on focused status', async () => {
      const event = {
        sessionId: 'session-123',
        status: 'focused' as const,
      };

      await service.handleSessionHeartbeat(event);

      expect(mockPrisma.studySession.update).not.toHaveBeenCalled();
    });
  });

  describe('autoCloseAbandonedSessions', () => {
    it('should close sessions older than threshold', async () => {
      const oldSession = {
        id: 'old-session',
        userId: 'user-123',
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        endTime: null,
      };

      mockPrisma.studySession.findMany.mockResolvedValue([oldSession]);
      mockPrisma.studySession.update.mockResolvedValue({});

      const count = await service.autoCloseAbandonedSessions(30); // 30 min threshold

      expect(count).toBe(1);
      expect(mockPrisma.studySession.update).toHaveBeenCalledWith({
        where: { id: 'old-session' },
        data: expect.objectContaining({
          endTime: expect.any(Date),
          durationMinutes: expect.any(Number),
          focusScore: 20, // Low score for abandoned
        }),
      });
    });
  });
});
