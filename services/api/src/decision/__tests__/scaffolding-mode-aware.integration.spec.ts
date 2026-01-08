import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionModule } from '../decision.module';
import { ScaffoldingInitializerService } from '../application/scaffolding-initializer.service';
import { ScaffoldingSignalDetectorService } from '../application/scaffolding-signal-detector.service';
import { ScaffoldingService } from '../application/scaffolding.service';
import { DecisionService } from '../application/decision.service';
import { ContentMode, Language } from '@prisma/client';

/**
 * SCRIPT 03 - Integration Tests
 * 
 * Tests the complete scaffolding flow:
 * - Mode-aware initialization (Fase 1)
 * - Signal detection and adjustment (Fase 2)
 * - Cooldown (GAP 4)
 * - Consecutive sessions (GAP 5)
 * - Policy override (GAP 6)
 */
describe('Scaffolding Mode-Aware Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scaffoldingInitializer: ScaffoldingInitializerService;
  let scaffoldingSignalDetector: ScaffoldingSignalDetectorService;
  let scaffoldingService: ScaffoldingService;
  let decisionService: DecisionService;

  const testUserId = 'test-user-scaffolding-integration';
  const testContentId = 'test-content-scaffolding';
  const testSessionId = 'test-session-scaffolding';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DecisionModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    scaffoldingInitializer = moduleFixture.get<ScaffoldingInitializerService>(
      ScaffoldingInitializerService
    );
    scaffoldingSignalDetector = moduleFixture.get<ScaffoldingSignalDetectorService>(
      ScaffoldingSignalDetectorService
    );
    scaffoldingService = moduleFixture.get<ScaffoldingService>(ScaffoldingService);
    decisionService = moduleFixture.get<DecisionService>(DecisionService);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.learner_profiles.deleteMany({
      where: { user_id: testUserId },
    });
    await prisma.session_events.deleteMany({
      where: { reading_sessions: { user_id: testUserId } },
    });
    await prisma.reading_sessions.deleteMany({
      where: { user_id: testUserId },
    });
    await prisma.contents.deleteMany({
      where: { id: testContentId },
    });

    await app.close();
  });

  describe('Fase 1: Mode-Aware Initialization', () => {
    it('should initialize DIDACTIC mode with L2 for new user', async () => {
      const level = await scaffoldingInitializer.getInitialLevel({
        mode: ContentMode.DIDACTIC,
        learnerProfile: {
          isNewUser: true,
          avgMastery: 0,
          recentPerformance: 0,
        },
        policyOverride: undefined,
      });

      expect(level).toBe(2);
    });

    it('should initialize NARRATIVE mode with L0 for experienced user', async () => {
      const level = await scaffoldingInitializer.getInitialLevel({
        mode: ContentMode.NARRATIVE,
        learnerProfile: {
          isNewUser: false,
          avgMastery: 0.85,
          recentPerformance: 0.88,
        },
        policyOverride: undefined,
      });

      expect(level).toBe(0);
    });

    it('should respect policy override (GAP 6)', async () => {
      const level = await scaffoldingInitializer.getInitialLevel({
        mode: ContentMode.DIDACTIC,
        learnerProfile: {
          isNewUser: false,
          avgMastery: 0.85,
          recentPerformance: 0.88,
        },
        policyOverride: 3, // Policy override to L3
      });

      expect(level).toBe(3);
    });
  });

  describe('Fase 2: Signal Detection', () => {
    beforeEach(async () => {
      // Create user first
      await prisma.users.upsert({
        where: { id: testUserId },
        create: {
          id: testUserId,
          email: `${testUserId}@test.com`,
          name: 'Test User',
        },
        update: {},
      });

      // Then create learner profile
      await prisma.learner_profiles.upsert({
        where: { user_id: testUserId },
        create: {
          users: {
            connect: { id: testUserId },
          },
          scaffolding_state_json: {
            currentLevel: 2,
            lastLevelChangeAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
            fadingMetrics: {
              consecutiveSuccesses: 0,
              interventionDismissalRate: 0,
            },
          },
        } as any,
        update: {
          scaffolding_state_json: {
            currentLevel: 2,
            lastLevelChangeAt: new Date(Date.now() - 10 * 60 * 1000),
            fadingMetrics: {
              consecutiveSuccesses: 0,
              interventionDismissalRate: 0,
            },
          },
        },
      });

      await prisma.contents.upsert({
        where: { id: testContentId },
        create: {
          id: testContentId,
          type: 'TEXT',
          title: 'Test Content',
          mode: ContentMode.DIDACTIC,
          original_language: Language.PT_BR,
          raw_text: 'Test content for scaffolding integration tests.',
        },
        update: {},
      });

      await prisma.reading_sessions.upsert({
        where: { id: testSessionId },
        create: {
          id: testSessionId,
          user_id: testUserId,
          content_id: testContentId,
        },
        update: {},
      });
    });

    it('should detect INCREASE signal on doubt spike', async () => {
      // Create 3 DOUBT events in last 5 minutes
      const now = new Date();
      await prisma.session_events.createMany({
        data: [
          {
            reading_session_id: testSessionId,
            event_type: 'DOUBT' as any,
            payload_json: {},
            created_at: new Date(now.getTime() - 2 * 60 * 1000),
          },
          {
            reading_session_id: testSessionId,
            event_type: 'DOUBT' as any,
            payload_json: {},
            created_at: new Date(now.getTime() - 3 * 60 * 1000),
          },
          {
            reading_session_id: testSessionId,
            event_type: 'DOUBT' as any,
            payload_json: {},
            created_at: new Date(now.getTime() - 4 * 60 * 1000),
          },
        ],
      });

      const profile = await prisma.learner_profiles.findUnique({
        where: { user_id: testUserId },
        select: { scaffolding_state_json: true },
      });

      const signal = await scaffoldingSignalDetector.detectSignal(
        testUserId,
        testContentId,
        ContentMode.DIDACTIC,
        profile.scaffolding_state_json as any
      );

      expect(signal.type).toBe('INCREASE');
      expect(signal.reason).toBe('doubt_spike');
      expect(signal.evidence.doubtSpike).toBe(true);
    });

    it('should detect DECREASE signal with 3+ consecutive sessions (GAP 5)', async () => {
      // Update profile with 3 consecutive successes
      await prisma.learner_profiles.update({
        where: { user_id: testUserId },
        data: {
          scaffolding_state_json: {
            currentLevel: 2,
            lastLevelChangeAt: new Date(Date.now() - 10 * 60 * 1000),
            fadingMetrics: {
              consecutiveSuccesses: 3,
              interventionDismissalRate: 0,
            },
          },
        },
      });

      // Create good performance events
      await prisma.session_events.createMany({
        data: [
          {
            reading_session_id: testSessionId,
            event_type: 'CHECKPOINT_ANSWER' as any,
            payload_json: { completion_quality: 0.9 },
            created_at: new Date(),
          },
          {
            reading_session_id: testSessionId,
            event_type: 'QUIZ_COMPLETE' as any,
            payload_json: { correct_count: 9, total_count: 10 },
            created_at: new Date(),
          },
        ],
      });

      const profile = await prisma.learner_profiles.findUnique({
        where: { user_id: testUserId },
        select: { scaffolding_state_json: true },
      });

      const signal = await scaffoldingSignalDetector.detectSignal(
        testUserId,
        testContentId,
        ContentMode.DIDACTIC,
        profile.scaffolding_state_json as any
      );

      expect(signal.type).toBe('DECREASE');
      expect(signal.reason).toBe('consistent_mastery');
      expect(signal.evidence.consecutiveSessions).toBe(3);
    });

    it('should respect cooldown period (GAP 4)', async () => {
      // Set last change to 2 minutes ago (within 5-minute cooldown)
      await prisma.learner_profiles.update({
        where: { user_id: testUserId },
        data: {
          scaffolding_state_json: {
            currentLevel: 2,
            lastLevelChangeAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
            fadingMetrics: {
              consecutiveSuccesses: 0,
              interventionDismissalRate: 0,
            },
          },
        },
      });

      // Create doubt spike
      const now = new Date();
      await prisma.session_events.createMany({
        data: [
          {
            reading_session_id: testSessionId,
            event_type: 'DOUBT' as any,
            payload_json: {},
            created_at: new Date(now.getTime() - 1 * 60 * 1000),
          },
          {
            reading_session_id: testSessionId,
            event_type: 'DOUBT' as any,
            payload_json: {},
            created_at: new Date(now.getTime() - 2 * 60 * 1000),
          },
          {
            reading_session_id: testSessionId,
            event_type: 'DOUBT' as any,
            payload_json: {},
            created_at: new Date(now.getTime() - 3 * 60 * 1000),
          },
        ],
      });

      const profileBefore = await prisma.learner_profiles.findUnique({
        where: { user_id: testUserId },
        select: { scaffolding_state_json: true },
      });

      const levelBefore = (profileBefore.scaffolding_state_json as any).currentLevel;

      // Signal should be detected but not applied due to cooldown
      const signal = await scaffoldingSignalDetector.detectSignal(
        testUserId,
        testContentId,
        ContentMode.DIDACTIC,
        profileBefore.scaffolding_state_json as any
      );

      expect(signal.type).toBe('INCREASE');

      // Verify cooldown prevents update
      const timeSinceLastChange = Date.now() - new Date((profileBefore.scaffolding_state_json as any).lastLevelChangeAt).getTime();
      const COOLDOWN_MS = 5 * 60 * 1000;
      expect(timeSinceLastChange).toBeLessThan(COOLDOWN_MS);

      // Level should not change due to cooldown
      const profileAfter = await prisma.learner_profiles.findUnique({
        where: { user_id: testUserId },
        select: { scaffolding_state_json: true },
      });

      expect((profileAfter.scaffolding_state_json as any).currentLevel).toBe(levelBefore);
    });
  });

  describe('ScaffoldingService.updateLevel', () => {
    it('should update level and reset consecutiveSuccesses on INCREASE', async () => {
      await prisma.learner_profiles.update({
        where: { user_id: testUserId },
        data: {
          scaffolding_state_json: {
            currentLevel: 2,
            lastLevelChangeAt: new Date(Date.now() - 10 * 60 * 1000),
            fadingMetrics: {
              consecutiveSuccesses: 2,
              interventionDismissalRate: 0,
            },
          },
        },
      });

      await scaffoldingService.updateLevel(
        testUserId,
        3,
        'doubt_spike',
        ContentMode.DIDACTIC,
        'INCREASE'
      );

      const profile = await prisma.learner_profiles.findUnique({
        where: { user_id: testUserId },
        select: { scaffolding_state_json: true },
      });

      const state = profile.scaffolding_state_json as any;
      expect(state.currentLevel).toBe(3);
      expect(state.fadingMetrics.consecutiveSuccesses).toBe(0); // Reset on INCREASE
    });

    it('should update level and reset consecutiveSuccesses on DECREASE', async () => {
      await prisma.learner_profiles.update({
        where: { user_id: testUserId },
        data: {
          scaffolding_state_json: {
            currentLevel: 2,
            lastLevelChangeAt: new Date(Date.now() - 10 * 60 * 1000),
            fadingMetrics: {
              consecutiveSuccesses: 3,
              interventionDismissalRate: 0,
            },
          },
        },
      });

      await scaffoldingService.updateLevel(
        testUserId,
        1,
        'consistent_mastery',
        ContentMode.DIDACTIC,
        'DECREASE'
      );

      const profile = await prisma.learner_profiles.findUnique({
        where: { user_id: testUserId },
        select: { scaffolding_state_json: true },
      });

      const state = profile.scaffolding_state_json as any;
      expect(state.currentLevel).toBe(1);
      expect(state.fadingMetrics.consecutiveSuccesses).toBe(0); // Reset on DECREASE
    });
  });
});
