import { Test, TestingModule } from "@nestjs/testing";
import { DecisionService } from "./decision.service";
import { PrismaService } from "../../prisma/prisma.service";
import { IDecisionLogRepository } from "../domain/decision-log.repository.interface";
import { ScaffoldingService } from "./scaffolding.service";
import { TelemetryService } from "../../telemetry/telemetry.service";
import {
  DecisionInput,
  DecisionSignals,
  SuppressReason,
} from "../domain/decision.types";

describe("DecisionService", () => {
  let service: DecisionService;
  let prisma: PrismaService;
  let logRepository: IDecisionLogRepository;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
    },
    institution_policies: {
      findFirst: jest.fn(),
    },
    family_policies: {
      findFirst: jest.fn(),
    },
    usage_events: {
      aggregate: jest.fn(),
    },
  };

  const mockScaffoldingService = {
    calculateFadingLevel: jest.fn().mockResolvedValue(2),
    getThresholdMultipliers: jest
      .fn()
      .mockReturnValue({ doubtSensitivity: 1.0 }),
    getScaffoldingConfig: jest.fn().mockReturnValue({ name: "Guided" }),
  };

  const mockTelemetryService = {
    track: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogRepository = {
    logDecision: jest.fn().mockResolvedValue("log_123"),
    logDecisionV2: jest.fn().mockResolvedValue("log_123_v2"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: IDecisionLogRepository,
          useValue: mockLogRepository,
        },
        {
          provide: ScaffoldingService,
          useValue: mockScaffoldingService,
        },
        {
          provide: TelemetryService,
          useValue: mockTelemetryService,
        },
      ],
    }).compile();

    service = module.get<DecisionService>(DecisionService);
    prisma = module.get<PrismaService>(PrismaService);
    logRepository = module.get<IDecisionLogRepository>(IDecisionLogRepository);

    jest.clearAllMocks();
  });

  const defaultSignals: DecisionSignals = {
    doubtsInWindow: 0,
    checkpointFailures: 0,
    flowState: "FLOW",
    summaryQuality: "OK",
  };

  const defaultInput: DecisionInput = {
    userId: "user_123",
    sessionId: "session_456",
    contentId: "content_789",
    uiPolicyVersion: "1.0.0",
    signals: defaultSignals,
  };

  const mockDefaultPolicy = {
    transfer_enabled: true,
    scaffolding_level_default: 2,
    fading_enabled: true,
    llm_budget_daily_tokens: 1000,
    decision_policy_json: {},
  };

  it("should return NO_OP when no triggers are present", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });

    const result = await service.makeDecision(defaultInput);

    expect(result.action).toBe("NO_OP");
    expect(result.reason).toBe("NO_TRIGGER");
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should return ASSIGN_MISSION ANALOGY on explicit user request", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        explicitUserAction: "USER_ASKS_ANALOGY" as const,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.action).toBe("ASSIGN_MISSION");
    expect(result.payload.missionType).toBe("ANALOGY");
    expect(result.channel).toBe("CACHED_LLM"); // Budget OK
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should force DETERMINISTIC channel when budget is exceeded", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 2000 },
    }); // Over budget (1000)

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        explicitUserAction: "USER_ASKS_ANALOGY" as const,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.channel).toBe("DETERMINISTIC");
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should handle Doubt Spike (>= 3 doubts)", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        doubtsInWindow: 3,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.action).toBe("ASK_PROMPT");
    expect(result.reason).toBe("DOUBT_SPIKE");
    expect(result.payload.suggestedMission).toBe("HUGGING");
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should handle Checkpoint Failures (>= 2 fails)", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        checkpointFailures: 2,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.action).toBe("ASSIGN_MISSION");
    expect(result.reason).toBe("CHECKPOINT_FAIL");
    expect(result.payload.scaffoldingAction).toBe("UP");
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should handle Poor Summary Quality", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        summaryQuality: "EMPTY" as const,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.action).toBe("GUIDED_SYNTHESIS");
    expect(result.reason).toBe("POST_SUMMARY");
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should handle ERRATIC flow with NO_OP and cooldown", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue(
      mockDefaultPolicy,
    );
    mockPrisma.usage_events.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        flowState: "ERRATIC" as const,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.action).toBe("NO_OP");
    expect(result.reason).toBe("LOW_FLOW");
    expect(result.payload.cooldownSeconds).toBeDefined();
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  it("should return NO_OP directly if transfer is disabled in policy", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
    mockPrisma.institution_policies.findFirst.mockResolvedValue({
      ...mockDefaultPolicy,
      transfer_enabled: false,
    });

    const input = {
      ...defaultInput,
      signals: {
        ...defaultSignals,
        explicitUserAction: "USER_ASKS_ANALOGY" as const,
      },
    };

    const result = await service.makeDecision(input);

    expect(result.action).toBe("NO_OP");
    expect(mockLogRepository.logDecisionV2).toHaveBeenCalled();
  });

  describe("Suppression Scenarios (v2)", () => {
    it("T1: should suppress action when Transfer is disabled in policy", async () => {
      // Setup: Transfer disabled
      mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
      mockPrisma.institution_policies.findFirst.mockResolvedValue({
        ...mockDefaultPolicy,
        transfer_enabled: false,
      });
      mockPrisma.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      // Action trigger (Explicit Ask)
      const input = {
        ...defaultInput,
        signals: {
          ...defaultSignals,
          explicitUserAction: "USER_ASKS_ANALOGY" as const,
        },
      };

      const result = await service.makeDecision(input);

      // Verify Output: NO_OP
      expect(result.action).toBe("NO_OP");

      // Verify Log: Suppressed with POLICY_DISABLED
      expect(mockLogRepository.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          finalAction: "NO_OP",
          suppressed: true,
          suppressReasons: expect.arrayContaining(["POLICY_DISABLED"]),
        }),
        expect.anything(),
      );
    });

    it("T2: should suppress LLM action when Budget is exceeded", async () => {
      // Setup: Budget exceeded
      mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
      mockPrisma.institution_policies.findFirst.mockResolvedValue(
        mockDefaultPolicy,
      );
      mockPrisma.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 2000 },
      }); // > 1000

      // Action trigger that requires LLM (Explicit Analogy)
      // We set explicitUserAction to bypass PHASE_DURING check, asking for LLM intervention.

      jest.spyOn(service as any, "proposeAction").mockReturnValue({
        action: "CALL_AGENT",
        channelHint: "LLM",
        reason: "CHECKPOINT_FAIL",
      });

      // Provide explicit action so explicitAsk=true
      const input = {
        ...defaultInput,
        signals: {
          ...defaultSignals,
          explicitUserAction: "USER_EXPLICIT_ASK" as const,
        },
      };

      const result = await service.makeDecision(input);

      expect(result.action).toBe("NO_OP");
      expect(mockLogRepository.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateAction: "CALL_AGENT",
          finalAction: "NO_OP",
          suppressed: true,
          suppressReasons: expect.arrayContaining(["BUDGET_EXCEEDED"]),
        }),
        expect.anything(),
      );
    });

    // TODO: This test currently cannot pass because makeDecision() hardcodes phase='POST'
    // Phase detection from session state needs to be implemented
    it.skip("T3: should suppress LLM action during DURING phase if invisible", async () => {
      // Mock proposal again to force CALL_AGENT
      jest.spyOn(service as any, "proposeAction").mockReturnValue({
        action: "CALL_AGENT",
        channelHint: "LLM",
        reason: "DETERMINISTIC",
      });

      mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
      mockPrisma.institution_policies.findFirst.mockResolvedValue(
        mockDefaultPolicy,
      );
      mockPrisma.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      // No explicit ask
      const input = {
        ...defaultInput,
        signals: {
          ...defaultSignals,
          explicitUserAction: undefined,
        },
      };

      const result = await service.makeDecision(input);

      expect(result.action).toBe("NO_OP");
      expect(mockLogRepository.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressReasons: expect.arrayContaining([
            SuppressReason.PHASE_DURING_INVISIBLE,
          ]),
        }),
        expect.anything(),
      );
    });

    it("T4: should suppress action when Flow is Low", async () => {
      // Mock proposal to something active
      jest.spyOn(service as any, "proposeAction").mockReturnValue({
        action: "ASK_PROMPT",
        channelHint: "DETERMINISTIC",
        reason: "DOUBT_SPIKE",
      });

      mockPrisma.users.findUnique.mockResolvedValue({ id: "user_123" });
      mockPrisma.institution_policies.findFirst.mockResolvedValue(
        mockDefaultPolicy,
      );
      mockPrisma.usage_events.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const input = {
        ...defaultInput,
        signals: {
          ...defaultSignals,
          flowState: "LOW_FLOW" as const, // Trigger Low Flow logic
        },
      };

      const result = await service.makeDecision(input);

      expect(result.action).toBe("NO_OP");
      expect(mockLogRepository.logDecisionV2).toHaveBeenCalledWith(
        expect.objectContaining({
          suppressReasons: expect.arrayContaining(["LOW_FLOW_SILENCE"]),
        }),
        expect.anything(),
      );
    });
  });
});
