import { Test, TestingModule } from "@nestjs/testing";
import { LearningOrchestratorService } from "./learning-orchestrator.service";
import { PrismaService } from "../../prisma/prisma.service";
import { DecisionService } from "../../decision/application/decision.service";
import { SrsService } from "../../srs/srs.service";
import { AssessmentService } from "../../assessment/assessment.service";
import { ReadingSessionsService } from "../../sessions/reading-sessions.service";

describe("LearningOrchestratorService", () => {
  let service: LearningOrchestratorService;
  let prisma: PrismaService;
  let decisionService: DecisionService;
  let srsService: SrsService;
  let assessmentService: AssessmentService;
  let sessionsService: ReadingSessionsService;

  const mockPrisma = {
    reading_sessions: {
      findUnique: jest.fn(),
    },
  };

  const mockDecisionService = {
    makeDecision: jest.fn(),
  };

  const mockSrsService = {
    getDueItems: jest.fn(),
  };

  const mockAssessmentService = {
    getPendingCheckpoints: jest.fn(),
  };

  const mockSessionsService = {
    getRecentSessionStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningOrchestratorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DecisionService, useValue: mockDecisionService },
        { provide: SrsService, useValue: mockSrsService },
        { provide: AssessmentService, useValue: mockAssessmentService },
        { provide: ReadingSessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    service = module.get<LearningOrchestratorService>(
      LearningOrchestratorService,
    );
    prisma = module.get<PrismaService>(PrismaService);
    decisionService = module.get<DecisionService>(DecisionService);
    srsService = module.get<SrsService>(SrsService);
    assessmentService = module.get<AssessmentService>(AssessmentService);
    sessionsService = module.get<ReadingSessionsService>(
      ReadingSessionsService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getNextActions", () => {
    const sessionId = "session-123";
    const userId = "user-123";
    const contentId = "content-123";

    beforeEach(() => {
      mockPrisma.reading_sessions.findUnique.mockResolvedValue({
        id: sessionId,
        contents: {
          id: contentId,
          mode: "READING",
          title: "Test Content",
        },
      });
      mockSrsService.getDueItems.mockResolvedValue([]);
      mockDecisionService.makeDecision.mockResolvedValue({ action: "NO_OP" });
      mockAssessmentService.getPendingCheckpoints.mockResolvedValue([]);
      mockSessionsService.getRecentSessionStats.mockResolvedValue({
        doubtsCount: 0,
        timeSpent: 5,
      });
    });

    it("should return default navigation when no actions are available", async () => {
      const actions = await service.getNextActions(sessionId, userId);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("CONTENT_NAV");
      expect(actions[0].reasonCode).toBe("DEFAULT_NAV");
    });

    it("should prioritize SRS items correctly (Overdue > Due)", async () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 1);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      mockSrsService.getDueItems.mockResolvedValue([
        { id: "1", word: "Easy Word", due_at: futureDate, srs_stage: "D3" },
        { id: "2", word: "Hard Word", due_at: overdueDate, srs_stage: "D1" }, // Overdue
      ]);

      const actions = await service.getNextActions(sessionId, userId);

      // Overdue item (Priority 80) should come before default nav (Priority 10)
      // Due item (Future) shouldn't be here based on getDueItems implementation normally,
      // but if service returns it, logic applies.
      // Wait, logic says: isOverdue ? 80 : 50.

      const hardWordAction = actions.find((a) => a.payload.vocabId === "2");
      const easyWordAction = actions.find((a) => a.payload.vocabId === "1");

      expect(hardWordAction).toBeDefined();
      expect(hardWordAction.priority).toBe(80);

      expect(easyWordAction).toBeDefined();
      expect(easyWordAction.priority).toBe(50);

      // Sorted Descending
      expect(actions[0]).toBe(hardWordAction);
    });

    it("should include heavy intervention when DOUBT_SPIKE detected", async () => {
      mockDecisionService.makeDecision.mockResolvedValue({
        action: "ASK_PROMPT",
        channel: "DETERMINISTIC",
        reason: "DOUBT_SPIKE",
        payload: { hint: "Try this" },
      });

      const actions = await service.getNextActions(sessionId, userId);

      const intervention = actions.find((a) => a.type === "INTERVENTION");
      expect(intervention).toBeDefined();
      expect(intervention.priority).toBe(75); // Urgent
      expect(intervention.reasonCode).toBe("DOUBT_SPIKE");
    });

    it("should respect top 3 limit", async () => {
      // Mock many items
      mockSrsService.getDueItems.mockResolvedValue([
        { id: "1", word: "W1", due_at: new Date(0), srs_stage: "D1" },
        { id: "2", word: "W2", due_at: new Date(0), srs_stage: "D1" },
        { id: "3", word: "W3", due_at: new Date(0), srs_stage: "D1" },
        { id: "4", word: "W4", due_at: new Date(0), srs_stage: "D1" },
      ]); // 4 items priority 80

      const actions = await service.getNextActions(sessionId, userId);
      expect(actions).toHaveLength(3);
    });

    it("should include pending checkpoints as BLOCKER priority", async () => {
      mockAssessmentService.getPendingCheckpoints.mockResolvedValue([
        { id: "assess-1", schooling_level_target: "B1", content_id: contentId },
      ]);

      const actions = await service.getNextActions(sessionId, userId);

      const checkpoint = actions.find((a) => a.type === "CHECKPOINT");
      expect(checkpoint).toBeDefined();
      expect(checkpoint!.priority).toBe(90);
      expect(checkpoint!.isBlocking).toBe(true);
    });

    it("should enrich signals using ReadingSessionsService stats", async () => {
      // Mock stats showing high doubt
      mockSessionsService.getRecentSessionStats.mockResolvedValue({
        doubtsCount: 5,
        timeSpent: 10,
      });

      await service.getNextActions(sessionId, userId);

      // Verify makeDecision was called with enriched signals
      expect(mockDecisionService.makeDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          signals: expect.objectContaining({
            doubtsInWindow: 5,
            flowState: "LOW_FLOW", // > 3 doubts = LOW_FLOW
          }),
        }),
      );
    });
  });
});
