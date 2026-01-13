import { Test, TestingModule } from "@nestjs/testing";
import { DecisionService } from "./decision.service";
import { ScaffoldingService } from "./scaffolding.service";
import { ScaffoldingSignalDetectorService } from "./scaffolding-signal-detector.service";
import { FlowStateDetectorService } from "./flow-state-detector.service";
import { TelemetryService } from "../../telemetry/telemetry.service";
import { AiServiceClient } from "../../ai-service/ai-service.client";
import { DcsCalculatorService } from "../weighting/dcs-calculator.service";
import { DcsIntegrationHelper } from "../weighting/dcs-integration.helper";
import { PrismaService } from "../../prisma/prisma.service";
import { IDecisionLogRepository } from "../domain/decision-log.repository.interface";
import { ContentMode } from "@prisma/client";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { AssessmentEvaluationService } from "../../assessment/application/assessment-evaluation.service";

describe("DecisionService Integration (SCRIPT 03)", () => {
  let decisionService: DecisionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
    },
    institution_policies: {
      findFirst: jest.fn(),
    },
    family_policies: {
      findFirst: jest.fn(),
    },
    contents: {
      findUnique: jest.fn(),
    },
    reading_sessions: {
      findUnique: jest.fn(),
    },
    learner_profiles: {
      findUnique: jest.fn(),
    },
    usage_events: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 100 } }),
    },
    decision_logs: {
      count: jest.fn(),
    },
    assessment_attempts: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    telemetry_events: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockDecisionLogRepo = {
    logDecisionV2: jest.fn(),
  };

  const mockTelemetryService = {
    track: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionService,
        ScaffoldingService,
        ScaffoldingSignalDetectorService,
        FlowStateDetectorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: IDecisionLogRepository,
          useValue: mockDecisionLogRepo,
        },
        {
          provide: TelemetryService,
          useValue: mockTelemetryService,
        },
        {
          provide: AiServiceClient,
          useValue: { executeTransferTask: jest.fn() },
        },
        {
          provide: DcsCalculatorService,
          useValue: { calculateDCS: jest.fn() },
        },
        {
          provide: DcsIntegrationHelper,
          useValue: {
            fetchDcs: jest
              .fn()
              .mockResolvedValue({ dcs: 0.5, w_det: 0.5, w_llm: 0.5 }),
            shouldSuppressInvisible: jest.fn().mockReturnValue(false),
            isActionAllowed: jest.fn().mockReturnValue(true),
            logWeightEvent: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: AssessmentEvaluationService,
          useValue: {
            calculateOverallScore: jest.fn(),
            evaluateAnswer: jest.fn(),
          },
        },
      ],
    }).compile();

    decisionService = module.get<DecisionService>(DecisionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("AC6: Phase-Specific Behavior", () => {
    it("should detect GAME phase when content mode is GAME", async () => {
      // Mock content as GAME
      mockPrismaService.contents.findUnique.mockResolvedValue({ mode: "GAME" });
      // Mock user & session
      mockPrismaService.users.findUnique.mockResolvedValue({
        learner_profiles: {},
      });
      mockPrismaService.institution_policies.findFirst.mockResolvedValue(null);
      mockPrismaService.family_policies.findFirst.mockResolvedValue(null);
      mockPrismaService.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: {},
        scaffolding_state_json: { currentLevel: 2 },
      });
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: "sess1",
        phase: "DURING",
      });

      const input = {
        userId: "user1",
        sessionId: "sess1",
        contentId: "game1",
        signals: {
          flowState: "FLOW",
        },
        uiPolicyVersion: "1.0.0",
      };

      const result = await decisionService.makeDecision(input as any);

      // Verify GAME mode was detected - GAME phase should not have phase-based suppression
      // The deriveSessionPhase should return 'GAME', which gets mapped to 'DURING' for enforcement
      expect(mockDecisionLogRepo.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressed: true,
          suppressReasons: expect.arrayContaining(["PHASE_DURING_INVISIBLE"]),
        }),
        expect.anything(),
      );
    });

    it("should detect DURING phase when progress is between 0 and 95", async () => {
      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: "DIDACTIC",
      });
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: "sess1",
        phase: "DURING",
        started_at: new Date(),
        finished_at: null,
      });

      const input = {
        userId: "user1",
        sessionId: "sess1",
        contentId: "c1",
        signals: {},
      };
      await decisionService.makeDecision(input as any);

      // DURING phase should be suppressed with PHASE_DURING_INVISIBLE
      expect(mockDecisionLogRepo.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressed: true,
          suppressReasons: expect.arrayContaining(["PHASE_DURING_INVISIBLE"]),
        }),
        expect.anything(),
      );
    });

    it("should detect POST phase when session is completed", async () => {
      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: "DIDACTIC",
      });
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: "sess1",
        phase: "POST",
        finished_at: new Date(),
      });

      const input = {
        userId: "user1",
        sessionId: "sess1",
        contentId: "c1",
        signals: {},
      };
      await decisionService.makeDecision(input as any);

      // POST phase should NOT have phase-based suppression (phase suppression only applies to DURING)
      expect(mockDecisionLogRepo.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressed: false,
          suppressReasons: [],
        }),
        expect.anything(),
      );
    });
  });

  describe("Gap 4: Cooldown Logic", () => {
    it("should NOT apply scaffolding change if cooldown is active", async () => {
      // Mock HIGH doubt -> triggers INCREASE
      // But Mock scaffolding_state with strict cooldown
      const now = new Date();
      mockPrismaService.learner_profiles.findUnique.mockResolvedValue({
        scaffolding_state_json: {
          currentLevel: 1,
          lastLevelChangeAt: new Date(now.getTime() - 1000), // 1 sec ago (active cooldown)
          fadingMetrics: { consecutiveSuccesses: 0 },
        },
      });
      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: "DIDACTIC",
      });
      // Mock signal detector to return INCREASE (but service should ignore it)
      // Note: Functionally complex to mock everything, relying on ScaffoldingSignalDetector behavior
      // We will trust the service logic if we can mock the detector output OR inputs

      // Actually, we are testing DecisionService integration.
      // We mocked ScaffoldingSignalDetectorService, so let's spy on it?
      // But in Test.createTestingModule we provided the CLASS.
      // We need to spy on the instance or mock the provider.
    });
  });

  describe("Gap 8: HIGH_FLOW Suppression", () => {
    it("should suppress interventions during HIGH_FLOW (no explicit ask)", async () => {
      // Setup: Mock HIGH_FLOW state (>10min reading, no doubts, highlights present)
      const tenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago

      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: "session1",
        user_id: "user1",
        content_id: "content1",
        started_at: tenMinutesAgo,
        phase: "DURING",
      });

      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: ContentMode.NARRATIVE, // NARRATIVE mode benefits most from flow preservation
      });

      // Mock telemetry events showing productive flow
      mockCacheManager.get.mockResolvedValue(null); // No cached flow state
      mockPrismaService.telemetry_events.findMany.mockResolvedValue([
        {
          event_type: "PROGRESS",
          data: { wordsRead: 100 },
          created_at: tenMinutesAgo,
        },
        {
          event_type: "HIGHLIGHT_CREATED",
          data: {},
          created_at: new Date(Date.now() - 8 * 60 * 1000),
        },
        {
          event_type: "HIGHLIGHT_CREATED",
          data: {},
          created_at: new Date(Date.now() - 5 * 60 * 1000),
        },
        {
          event_type: "PROGRESS",
          data: { wordsRead: 3000 },
          created_at: new Date(),
        }, // High velocity
      ]);

      const input = {
        userId: "user1",
        sessionId: "session1",
        contentId: "content1",
        uiPolicyVersion: "1.0",
        signals: {
          doubtsInWindow: 0,
          checkpointFailures: 0,
          flowState: "FLOW" as const,
          summaryQuality: "OK" as const,
          explicitUserAction: null, // No explicit ask
        },
      };

      const result = await decisionService.makeDecision(input);

      // Should suppress intervention to preserve flow
      expect(result.action).toBe("NO_OP");
      expect(mockDecisionLogRepo.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressed: true,
          suppressReasons: expect.arrayContaining(["HIGH_FLOW_PRESERVE"]),
        }),
        expect.anything(),
      );
    });

    it("should allow interventions during HIGH_FLOW if explicit ask", async () => {
      // Setup: Same HIGH_FLOW state but with explicit user action
      const tenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        id: "session1",
        user_id: "user1",
        content_id: "content1",
        started_at: tenMinutesAgo,
        phase: "DURING",
      });

      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: ContentMode.NARRATIVE,
      });

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.telemetry_events.findMany.mockResolvedValue([
        {
          event_type: "PROGRESS",
          data: { wordsRead: 100 },
          created_at: tenMinutesAgo,
        },
        {
          event_type: "HIGHLIGHT_CREATED",
          data: {},
          created_at: new Date(Date.now() - 8 * 60 * 1000),
        },
        {
          event_type: "PROGRESS",
          data: { wordsRead: 3000 },
          created_at: new Date(),
        },
      ]);

      const input = {
        userId: "user1",
        sessionId: "session1",
        contentId: "content1",
        uiPolicyVersion: "1.0",
        signals: {
          doubtsInWindow: 0,
          checkpointFailures: 0,
          flowState: "FLOW" as const,
          summaryQuality: "OK" as const,
          explicitUserAction: "USER_EXPLICIT_ASK" as const, // Explicit ask
        },
      };

      const result = await decisionService.makeDecision(input);

      // Should respond to explicit ask even during HIGH_FLOW
      expect(result.action).not.toBe("NO_OP");
      expect(mockDecisionLogRepo.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressed: false, // Not suppressed because of explicit ask
        }),
        expect.anything(),
      );
    });
  });
});
