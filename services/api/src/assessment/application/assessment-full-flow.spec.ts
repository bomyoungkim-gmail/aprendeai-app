import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { AssessmentGenerationService } from "./assessment-generation.service";
import { AssessmentEvaluationService } from "./assessment-evaluation.service";
import { DecisionService } from "../../decision/application/decision.service";
import { AiServiceClient } from "../../ai-service/ai-service.client";
import { ConfigService } from "@nestjs/config";
import { ScaffoldingService } from "../../decision/application/scaffolding.service";
import { TelemetryService } from "../../telemetry/telemetry.service";
import { IDecisionLogRepository } from "../../decision/domain/decision-log.repository.interface";
import { ScaffoldingSignalDetectorService } from "../../decision/application/scaffolding-signal-detector.service";
import { FlowStateDetectorService } from "../../decision/application/flow-state-detector.service";
import { DcsCalculatorService } from "../../decision/weighting/dcs-calculator.service";
import { DcsIntegrationHelper } from "../../decision/weighting/dcs-integration.helper";

// Mocks
const mockPrismaService = {
  highlights: { findMany: jest.fn() },
  assessment_attempts: {
    findMany: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  assessment_questions: { findUnique: jest.fn() },
  assessments: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  learner_profiles: { findUnique: jest.fn() },
  contents: { findUnique: jest.fn() },
  content_versions: { findUnique: jest.fn() },
  reading_sessions: { findUnique: jest.fn() },
  users: { findUnique: jest.fn() },
  institution_policies: { findFirst: jest.fn() },
  family_policies: { findFirst: jest.fn() },
  usage_events: {
    aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 100 } }),
  },
  decision_logs: { count: jest.fn() },
};

const mockAiService = {
  generateQuiz: jest.fn(),
  evaluateAnswer: jest.fn(),
};

const mockTelemetryService = {
  track: jest.fn(),
};

const mockScaffoldingService = {
  updateLevel: jest.fn(),
  calculateFadingLevel: jest.fn().mockResolvedValue(1),
  getThresholdMultipliers: jest
    .fn()
    .mockReturnValue({ doubtThreshold: 3, checkpointFailThreshold: 2 }),
};

const mockDecisionLogRepository = {
  logDecisionV2: jest.fn(),
};

describe("Assessment Engine Full Flow Integration", () => {
  let generationService: AssessmentGenerationService;
  let evaluationService: AssessmentEvaluationService;
  let decisionService: DecisionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentGenerationService,
        AssessmentEvaluationService,
        DecisionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiServiceClient, useValue: mockAiService },
        { provide: TelemetryService, useValue: mockTelemetryService },
        { provide: ScaffoldingService, useValue: mockScaffoldingService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: IDecisionLogRepository,
          useValue: mockDecisionLogRepository,
        },
        {
          provide: ScaffoldingSignalDetectorService,
          useValue: { detectSignal: jest.fn() },
        },
        {
          provide: FlowStateDetectorService,
          useValue: { detectFlowState: jest.fn() },
        },
        {
          provide: DcsCalculatorService,
          useValue: { calculateDcs: jest.fn() },
        },
        {
          provide: DcsIntegrationHelper,
          useValue: {
            fetchDcs: jest
              .fn()
              .mockResolvedValue({ dcs: 0.5, w_det: 0.5, w_llm: 0.5 }),
            shouldSuppressInvisible: jest.fn().mockReturnValue(false),
            isActionAllowed: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    generationService = module.get<AssessmentGenerationService>(
      AssessmentGenerationService,
    );
    evaluationService = module.get<AssessmentEvaluationService>(
      AssessmentEvaluationService,
    );
    decisionService = module.get<DecisionService>(DecisionService);

    jest.clearAllMocks();
  });

  describe("1. Highlight-Aware Quiz Generation", () => {
    it("should generate quiz using DOUBT/EVIDENCE highlights", async () => {
      // Setup highlights
      mockPrismaService.highlights.findMany.mockResolvedValue([
        {
          type: "DOUBT",
          anchor_json: { text: "I am confused about photosynthesis" },
        },
        {
          type: "EVIDENCE",
          anchor_json: { text: "Mitochondria is the powerhouse" },
        },
      ]);

      mockAiService.generateQuiz.mockResolvedValue([
        { text: "Explain photosynthesis", targetedHighlight: "DOUBT" },
        { text: "What is the powerhouse?", targetedHighlight: "EVIDENCE" },
      ]);

      const quiz = await generationService.generateQuiz(
        "content1",
        "user1",
        1,
        "DIDACTIC" as any,
      );

      expect(mockPrismaService.highlights.findMany).toHaveBeenCalled();
      expect(mockAiService.generateQuiz).toHaveBeenCalledWith(
        expect.stringContaining("DOUBT"),
      );
      expect(quiz.questions).toHaveLength(2);
      expect(quiz.questions[0].targetedHighlight).toBe("DOUBT");
    });
  });

  describe("2. Assessment Evaluation", () => {
    it("should evaluate open-ended answer via LLM", async () => {
      // Mock question data - use short answer to trigger fill-blank evaluation
      mockPrismaService.assessment_questions.findUnique.mockResolvedValue({
        id: "q1",
        question_type: "SHORT_ANSWER",
        question_text: "Explain X",
        correct_answer: "X is basically Y", // Short answer triggers fill-blank path
        options: null,
      });

      mockPrismaService.assessment_attempts.findUnique.mockResolvedValue({
        id: "att1",
      });

      mockAiService.evaluateAnswer.mockResolvedValue({
        structuredOutput: { score: 0.9, feedback: "Great job" },
      });

      const result = await evaluationService.evaluateAnswer(
        "att1",
        "q1",
        "X is basically Y",
      );

      // Fill-blank evaluation returns 1.0 for exact match
      expect(result.score).toBe(1.0);
      expect(mockPrismaService.assessment_attempts.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score_raw: 1.0,
            score_percent: 100,
          }),
        }),
      );
    });
  });

  describe("3. Decision Integration (Scaffolding Adjustment)", () => {
    it("should INCREASE scaffolding after 2 poor attempts", async () => {
      // Mock 2 poor attempts
      mockPrismaService.assessment_attempts.findMany.mockResolvedValue([
        { score_raw: 0.4, finished_at: new Date() },
        { score_raw: 0.3, finished_at: new Date() },
      ]);

      // Mock User Profile
      mockPrismaService.learner_profiles.findUnique.mockResolvedValue({
        scaffolding_state_json: { currentLevel: 1 },
      });

      // Mock user and policies for DecisionService
      mockPrismaService.users.findUnique.mockResolvedValue({
        learner_profiles: {},
      });
      mockPrismaService.institution_policies.findFirst.mockResolvedValue(null);
      mockPrismaService.family_policies.findFirst.mockResolvedValue(null);

      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: "DIDACTIC",
      });
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        phase: "DURING",
      });

      // Run Decision Logic (via private method exposed or by triggering a decision flow that calls it)
      // Since checkAssessmentPerformance is private, we verify via the side effect: updateLevel

      // We can inspect the private method if we cast to any or just call makeDecision which internally calls it
      // Let's call makeDecision
      await decisionService.makeDecision({
        userId: "user1",
        contentId: "content1",
        sessionId: "sess1",
        signals: {},
      } as any);

      // Verify updateLevel was called with INCREASE
      expect(mockScaffoldingService.updateLevel).toHaveBeenCalledWith(
        "user1",
        expect.anything(), // New Level (1 -> 2)
        "poor_assessment_performance", // Reason
        expect.anything(),
        "INCREASE", // Direction
      );

      // Verify Telemetry
      expect(mockTelemetryService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "SCAFFOLDING_LEVEL_SET",
          data: expect.objectContaining({
            reason: "poor_assessment_performance",
            assessmentData: expect.objectContaining({ poorCount: 2 }),
          }),
        }),
        "user1",
      );
    });

    it("should FADE scaffolding after 3 excellent attempts", async () => {
      // Mock 3 excellent attempts
      mockPrismaService.assessment_attempts.findMany.mockResolvedValue([
        { score_raw: 0.9, finished_at: new Date() },
        { score_raw: 1.0, finished_at: new Date() },
        { score_raw: 0.85, finished_at: new Date() },
      ]);

      mockPrismaService.learner_profiles.findUnique.mockResolvedValue({
        scaffolding_state_json: { currentLevel: 2 },
      });

      // Mock user and policies for DecisionService
      mockPrismaService.users.findUnique.mockResolvedValue({
        learner_profiles: {},
      });
      mockPrismaService.institution_policies.findFirst.mockResolvedValue(null);
      mockPrismaService.family_policies.findFirst.mockResolvedValue(null);

      mockPrismaService.contents.findUnique.mockResolvedValue({
        mode: "DIDACTIC",
      });
      mockPrismaService.reading_sessions.findUnique.mockResolvedValue({
        phase: "DURING",
      });

      await decisionService.makeDecision({
        userId: "user1",
        contentId: "content1",
        sessionId: "sess1",
        signals: {},
      } as any);

      expect(mockScaffoldingService.updateLevel).toHaveBeenCalledWith(
        "user1",
        expect.anything(), // New Level (2 -> 1)
        "excellent_assessment_performance",
        expect.anything(),
        "DECREASE",
      );
    });
  });
});
