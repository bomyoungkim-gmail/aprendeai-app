import { Test, TestingModule } from "@nestjs/testing";
import { DecisionService } from "./decision.service";
import { PrismaService } from "../../prisma/prisma.service";
import { IDecisionLogRepository } from "../domain/decision-log.repository.interface";
import { ScaffoldingService } from "./scaffolding.service";
import { TelemetryService } from "../../telemetry/telemetry.service";
import { DecisionInput } from "../domain/decision.types";
import { AiServiceClient } from "../../ai-service/ai-service.client";
import { DcsCalculatorService } from "../weighting/dcs-calculator.service";
import { DcsIntegrationHelper } from "../weighting/dcs-integration.helper";

describe("DecisionService - SCRIPT 10", () => {
  let service: DecisionService;
  let prismaService: any;
  let scaffoldingService: jest.Mocked<ScaffoldingService>;

  beforeEach(async () => {
    const mockPrisma = {
      users: { findUnique: jest.fn() },
      family_policies: { findFirst: jest.fn() },
      institution_policies: { findFirst: jest.fn() },
      usage_events: { aggregate: jest.fn() },
      decision_logs: { count: jest.fn() },
    } as any;

    const mockLogRepo = {
      logDecisionV2: jest.fn(),
    };

    const mockScaffolding = {
      calculateFadingLevel: jest.fn().mockResolvedValue(2),
      getThresholdMultipliers: jest
        .fn()
        .mockReturnValue({ doubtSensitivity: 1.0 }),
      getMaxInterventions: jest.fn().mockReturnValue(3),
    };

    const mockTelemetry = {
      track: jest.fn(),
    };

    const mockAiService = {
      executeTransferTask: jest.fn(),
    };

    const mockDcsCalculator = {};

    const mockDcsHelper = {
      fetchDcs: jest
        .fn()
        .mockResolvedValue({ dcs: 0.0, w_det: 0.0, w_llm: 1.0 }),
      shouldSuppressInvisible: jest.fn().mockReturnValue(false),
      isActionAllowed: jest.fn().mockReturnValue(true),
      logWeightEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IDecisionLogRepository, useValue: mockLogRepo },
        { provide: ScaffoldingService, useValue: mockScaffolding },
        { provide: ScaffoldingService, useValue: mockScaffolding },
        { provide: TelemetryService, useValue: mockTelemetry },
        { provide: AiServiceClient, useValue: mockAiService },
        { provide: DcsCalculatorService, useValue: mockDcsCalculator },
        { provide: DcsIntegrationHelper, useValue: mockDcsHelper },
      ],
    }).compile();

    service = module.get<DecisionService>(DecisionService);
    prismaService = module.get(PrismaService);
    scaffoldingService = module.get(ScaffoldingService);
  });

  describe("Decision Cache", () => {
    it("should cache decision results", async () => {
      // Setup
      prismaService.family_policies.findFirst.mockResolvedValue({
        llm_budget_daily_tokens: 5000,
        scaffolding_level_default: 2,
        fading_enabled: true,
        transfer_enabled: true,
        decision_policy_json: {},
      } as any);

      prismaService.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 100 },
      } as any);

      prismaService.decision_logs.count.mockResolvedValue(1);

      const input: DecisionInput = {
        userId: "user-123",
        sessionId: "session-456",
        contentId: "content-789",
        signals: {
          doubtsInWindow: 1,
          checkpointFailures: 0,
          flowState: "FLOW",
          summaryQuality: "OK",
        },
        uiPolicyVersion: "1.0.0",
      };

      // First call
      const result1 = await service.makeDecision(input);

      // Second call (should be cached)
      const result2 = await service.makeDecision(input);

      expect(result1).toEqual(result2);
      // Policy should only be fetched once due to cache
      expect(prismaService.family_policies.findFirst).toHaveBeenCalledTimes(1);
    });

    it("should not cache different inputs", async () => {
      prismaService.family_policies.findFirst.mockResolvedValue({
        llm_budget_daily_tokens: 5000,
        scaffolding_level_default: 2,
        fading_enabled: true,
        transfer_enabled: true,
        decision_policy_json: {},
      } as any);

      prismaService.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 100 },
      } as any);

      prismaService.decision_logs.count.mockResolvedValue(1);

      const input1: DecisionInput = {
        userId: "user-123",
        sessionId: "session-456",
        contentId: "content-789",
        signals: {
          doubtsInWindow: 1,
          checkpointFailures: 0,
          flowState: "FLOW",
          summaryQuality: "OK",
        },
        uiPolicyVersion: "1.0.0",
      };

      const input2: DecisionInput = {
        userId: "user-123",
        sessionId: "session-456",
        contentId: "content-789",
        signals: {
          doubtsInWindow: 3,
          checkpointFailures: 1,
          flowState: "FLOW",
          summaryQuality: "OK",
        }, // Different signal
        uiPolicyVersion: "1.0.0",
      };

      await service.makeDecision(input1);
      await service.makeDecision(input2);

      // Should fetch policy twice (different inputs)
      expect(prismaService.family_policies.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe("Max Interventions", () => {
    it("should suppress intervention when max exceeded", async () => {
      prismaService.family_policies.findFirst.mockResolvedValue({
        llm_budget_daily_tokens: 5000,
        scaffolding_level_default: 2,
        fading_enabled: true,
        transfer_enabled: true,
        decision_policy_json: {},
      } as any);

      prismaService.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 100 },
      } as any);

      // Simulate 3 recent interventions (at limit for L2)
      prismaService.decision_logs.count.mockResolvedValue(3);
      scaffoldingService.getMaxInterventions.mockReturnValue(3);

      const input: DecisionInput = {
        userId: "user-123",
        sessionId: "session-456",
        contentId: "content-789",
        signals: {
          doubtsInWindow: 3, // High doubt
          checkpointFailures: 1,
          flowState: "FLOW",
          summaryQuality: "OK",
        },
        uiPolicyVersion: "1.0.0",
      };

      const result = await service.makeDecision(input);

      // Should be suppressed due to max interventions
      expect(result.action).toBe("NO_OP");
    });

    it("should allow intervention when under max", async () => {
      prismaService.family_policies.findFirst.mockResolvedValue({
        llm_budget_daily_tokens: 5000,
        scaffolding_level_default: 2,
        fading_enabled: true,
        transfer_enabled: true,
        decision_policy_json: {},
      } as any);

      prismaService.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 100 },
      } as any);

      // Simulate 1 recent intervention (under limit)
      prismaService.decision_logs.count.mockResolvedValue(1);
      scaffoldingService.getMaxInterventions.mockReturnValue(3);

      const input: DecisionInput = {
        userId: "user-123",
        sessionId: "session-456",
        contentId: "content-789",
        signals: {
          doubtsInWindow: 3, // High doubt
          checkpointFailures: 1,
          flowState: "FLOW",
          summaryQuality: "OK",
        },
        uiPolicyVersion: "1.0.0",
      };

      const result = await service.makeDecision(input);

      // Should allow intervention
      expect(result.action).not.toBe("NO_OP");
    });
  });
});
