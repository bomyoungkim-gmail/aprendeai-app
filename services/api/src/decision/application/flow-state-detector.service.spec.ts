import { Test, TestingModule } from '@nestjs/testing';
import { FlowStateDetectorService } from './flow-state-detector.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TelemetryService } from '../../telemetry/telemetry.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('FlowStateDetectorService', () => {
  let service: FlowStateDetectorService;
  let prismaService: PrismaService;
  let cacheManager: any;

  // Use valid UUIDs for tests
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testContentId = '550e8400-e29b-41d4-a716-446655440001';
  const testSessionId = '550e8400-e29b-41d4-a716-446655440002';

  const mockPrismaService = {
    reading_sessions: {
      findUnique: jest.fn(),
    },
    telemetry_events: {
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockTelemetryService = {
    track: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowStateDetectorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: TelemetryService,
          useValue: mockTelemetryService,
        },
      ],
    }).compile();

    service = module.get<FlowStateDetectorService>(FlowStateDetectorService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFlowScore', () => {
    it('should return high score for ideal flow conditions', () => {
      const signals = {
        readingVelocity: 250, // High velocity (>200)
        doubtCount: 0, // No doubts
        rehighlightRate: 0.05, // Low rehighlight (<10%)
        sessionDuration: 20, // Long duration (>15 min)
      };

      const score = service['calculateFlowScore'](signals);

      expect(score).toBeGreaterThan(0.7); // Above FLOW_THRESHOLD
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should return low score for poor flow conditions', () => {
      const signals = {
        readingVelocity: 50, // Low velocity
        doubtCount: 5, // Many doubts
        rehighlightRate: 0.5, // High rehighlight
        sessionDuration: 2, // Short duration
      };

      const score = service['calculateFlowScore'](signals);

      expect(score).toBeLessThan(0.7); // Below FLOW_THRESHOLD
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge case: zero velocity', () => {
      const signals = {
        readingVelocity: 0,
        doubtCount: 0,
        rehighlightRate: 0,
        sessionDuration: 0,
      };

      const score = service['calculateFlowScore'](signals);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should weight velocity and doubts heavily (30% each)', () => {
      const highVelocityNoDoubts = {
        readingVelocity: 300,
        doubtCount: 0,
        rehighlightRate: 0.5, // Poor
        sessionDuration: 5, // Short
      };

      const score = service['calculateFlowScore'](highVelocityNoDoubts);

      // Should still get decent score due to velocity + no doubts (60% weight)
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe('getFlowReason', () => {
    it('should return "Not in flow state" for low score', () => {
      const signals = {
        readingVelocity: 50,
        doubtCount: 5,
        rehighlightRate: 0.5,
        sessionDuration: 2,
      };

      const reason = service['getFlowReason'](signals, 0.3);

      expect(reason).toBe('Not in flow state');
    });

    it('should list all positive indicators for high flow', () => {
      const signals = {
        readingVelocity: 250,
        doubtCount: 0,
        rehighlightRate: 0.05,
        sessionDuration: 20,
      };

      const reason = service['getFlowReason'](signals, 0.9);

      expect(reason).toContain('high reading velocity');
      expect(reason).toContain('no doubts');
      expect(reason).toContain('minimal rehighlights');
      expect(reason).toContain('sustained engagement');
    });

    it('should list only applicable indicators', () => {
      const signals = {
        readingVelocity: 150, // Below threshold
        doubtCount: 0,
        rehighlightRate: 0.05,
        sessionDuration: 20,
      };

      const reason = service['getFlowReason'](signals, 0.75);

      expect(reason).not.toContain('high reading velocity');
      expect(reason).toContain('no doubts');
      expect(reason).toContain('minimal rehighlights');
      expect(reason).toContain('sustained engagement');
    });
  });

  describe('detectFlowState', () => {
    it('should return cached flow state if available', async () => {
      const cachedState = {
        isInFlow: true,
        confidence: 0.85,
        signals: {
          readingVelocity: 250,
          doubtCount: 0,
          rehighlightRate: 0.05,
          sessionDuration: 20,
        },
        reason: 'Flow detected',
      };

      mockCacheManager.get.mockResolvedValue(cachedState);

      const result = await service.detectFlowState(testUserId, testContentId, testSessionId);

      expect(result).toEqual(cachedState);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`flow_state:${testUserId}:${testSessionId}`);
      expect(mockPrismaService.reading_sessions.findUnique).not.toHaveBeenCalled();
    });

    it('should detect flow state from telemetry when not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const sessionStartTime = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: testSessionId,
        started_at: sessionStartTime,
      });

      mockPrismaService.telemetry_events.findMany.mockResolvedValue([
        { event_type: 'PROGRESS', data: { wordsRead: 100 }, created_at: sessionStartTime },
        { event_type: 'HIGHLIGHT_CREATED', data: {}, created_at: new Date(Date.now() - 10 * 60 * 1000) },
        { event_type: 'PROGRESS', data: { wordsRead: 4000 }, created_at: new Date() },
      ]);

      const result = await service.detectFlowState(testUserId, testContentId, testSessionId);

      expect(result.isInFlow).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `flow_state:${testUserId}:${testSessionId}`,
        expect.any(Object),
        120000 // 2 minutes TTL
      );
    });

    it('should return default state on error', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.reading_sessions.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await service.detectFlowState(testUserId, testContentId, testSessionId);

      expect(result.isInFlow).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.reason).toContain('Error detecting flow');
    });
  });

  describe('gatherSignals', () => {
    it('should calculate reading velocity correctly', async () => {
      const sessionStartTime = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: testSessionId,
        started_at: sessionStartTime,
      });

      mockPrismaService.telemetry_events.findMany.mockResolvedValue([
        { event_type: 'PROGRESS', data: { wordsRead: 100 }, created_at: sessionStartTime },
        { event_type: 'PROGRESS', data: { wordsRead: 4100 }, created_at: new Date() },
      ]);

      const signals = await service['gatherSignals'](testUserId, testContentId, testSessionId);

      // 4000 words in 20 minutes = 200 words/min
      expect(signals.readingVelocity).toBe(200);
      expect(signals.sessionDuration).toBeCloseTo(20, 0);
    });

    it('should count doubts correctly', async () => {
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: testSessionId,
        started_at: new Date(Date.now() - 10 * 60 * 1000),
      });

      mockPrismaService.telemetry_events.findMany.mockResolvedValue([
        { event_type: 'DOUBT', data: {}, created_at: new Date() },
        { event_type: 'DOUBT', data: {}, created_at: new Date() },
        { event_type: 'DOUBT', data: {}, created_at: new Date() },
        { event_type: 'PROGRESS', data: {}, created_at: new Date() },
      ]);

      const signals = await service['gatherSignals'](testUserId, testContentId, testSessionId);

      expect(signals.doubtCount).toBe(3);
    });

    it('should calculate rehighlight rate correctly', async () => {
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: testSessionId,
        started_at: new Date(Date.now() - 10 * 60 * 1000),
      });

      mockPrismaService.telemetry_events.findMany.mockResolvedValue([
        { event_type: 'HIGHLIGHT_CREATED', data: {}, created_at: new Date() },
        { event_type: 'HIGHLIGHT_CREATED', data: {}, created_at: new Date() },
        { event_type: 'HIGHLIGHT_UPDATED', data: {}, created_at: new Date() }, // Rehighlight
        { event_type: 'HIGHLIGHT_CREATED', data: {}, created_at: new Date() },
      ]);

      const signals = await service['gatherSignals'](testUserId, testContentId, testSessionId);

      // 1 update out of 4 total highlight events = 0.25
      expect(signals.rehighlightRate).toBe(0.25);
    });
  });
});
