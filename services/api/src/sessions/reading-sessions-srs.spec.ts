import { Test, TestingModule } from "@nestjs/testing";
import { ReadingSessionsService } from "./reading-sessions.service";
import { PrismaService } from "../prisma/prisma.service";
import { SrsService } from "../srs/srs.service";
import { GamificationService } from "../gamification/gamification.service";
import { VocabService } from "../vocab/vocab.service";
import { OutcomesService } from "../outcomes/outcomes.service";
import { GatingService } from "../gating/gating.service";
import { QuickCommandParser } from "./parsers/quick-command.parser";
import { AiServiceClient } from "../ai-service/ai-service.client";
import { ProviderUsageService } from "../observability/provider-usage.service";
import { ProfileService } from "../profiles/profile.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AdvancePhaseUseCase } from "./application/use-cases/advance-phase.use-case";
import { StartSessionUseCase } from "./application/use-cases/start-session.use-case";
import { GetSessionUseCase } from "./application/use-cases/get-session.use-case";
import { UpdatePrePhaseUseCase } from "./application/use-cases/update-pre-phase.use-case";
import { RecordEventUseCase } from "./application/use-cases/record-event.use-case";
import { UpdateReadingProgressUseCase } from "./application/use-cases/update-reading-progress.use-case";
import { GetReadingProgressUseCase } from "./application/use-cases/get-reading-progress.use-case";
import { CreateBookmarkUseCase } from "./application/use-cases/create-bookmark.use-case";
import { GetBookmarksUseCase } from "./application/use-cases/get-bookmarks.use-case";
import { DeleteBookmarkUseCase } from "./application/use-cases/delete-bookmark.use-case";
import { ActivityService } from "../activity/activity.service";

// Mock dependencies
const mockPrismaService = {
  session_events: {
    findMany: jest.fn(),
  },
};

const mockSrsService = {
  scheduleNextReview: jest.fn(),
};

const mockAdvancePhaseUseCase = {
  execute: jest.fn(),
};

const mockOutcomesService = {
  computeSessionOutcomes: jest.fn(),
};

describe("ReadingSessionsService - SRS Integration", () => {
  let service: ReadingSessionsService;
  let prisma: typeof mockPrismaService;
  let srsService: typeof mockSrsService;
  let advancePhaseUseCase: typeof mockAdvancePhaseUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingSessionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SrsService, useValue: mockSrsService },
        { provide: AdvancePhaseUseCase, useValue: mockAdvancePhaseUseCase },
        { provide: OutcomesService, useValue: mockOutcomesService },
        // Mocks for other dependencies required by constructor
        { provide: ProfileService, useValue: {} },
        {
          provide: GamificationService,
          useValue: { registerActivity: jest.fn() },
        },
        {
          provide: VocabService,
          useValue: { createFromTargetWords: jest.fn() },
        },
        { provide: GatingService, useValue: {} },
        { provide: QuickCommandParser, useValue: {} },
        { provide: AiServiceClient, useValue: {} },
        { provide: ProviderUsageService, useValue: {} },
        { provide: ActivityService, useValue: { trackActivity: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        // Use cases
        { provide: StartSessionUseCase, useValue: {} },
        { provide: GetSessionUseCase, useValue: {} },
        { provide: UpdatePrePhaseUseCase, useValue: {} },
        { provide: RecordEventUseCase, useValue: {} },
        { provide: UpdateReadingProgressUseCase, useValue: {} },
        { provide: GetReadingProgressUseCase, useValue: {} },
        { provide: CreateBookmarkUseCase, useValue: {} },
        { provide: GetBookmarksUseCase, useValue: {} },
        { provide: DeleteBookmarkUseCase, useValue: {} },
      ],
    }).compile();

    service = module.get<ReadingSessionsService>(ReadingSessionsService);
    prisma = module.get(PrismaService);
    srsService = module.get(SrsService);
    advancePhaseUseCase = module.get(AdvancePhaseUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("advancePhase (FINISHED)", () => {
    const sessionId = "session-123";
    const userId = "user-456";
    const contentId = "content-789";

    const mockSessionUpdated = {
      id: sessionId,
      userId,
      contentId,
      phase: "FINISHED",
      targetWordsJson: [],
    };

    it("should schedule SRS reviews when session is finished", async () => {
      // Arrange
      mockAdvancePhaseUseCase.execute.mockResolvedValue(mockSessionUpdated);
      prisma.session_events.findMany.mockResolvedValue([
        {
          id: "evt-1",
          eventType: "MARK_UNKNOWN_WORD",
          payload_json: { word: "ephemeral", context: "Life is ephemeral." },
          reading_session_id: sessionId,
        },
      ]);

      // Act
      await service.advancePhase(sessionId, userId, "FINISHED");

      // Assert
      expect(prisma.session_events.findMany).toHaveBeenCalledWith({
        where: { reading_session_id: sessionId },
      });
      expect(srsService.scheduleNextReview).toHaveBeenCalledWith(
        userId,
        contentId,
        "ephemeral",
        "Life is ephemeral.",
      );
      expect(srsService.scheduleNextReview).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple vocab items", async () => {
      // Arrange
      mockAdvancePhaseUseCase.execute.mockResolvedValue(mockSessionUpdated);
      prisma.session_events.findMany.mockResolvedValue([
        {
          id: "evt-1",
          eventType: "MARK_UNKNOWN_WORD",
          payload_json: { word: "word1", context: "ctx1" },
        },
        {
          id: "evt-2",
          eventType: "MARK_UNKNOWN_WORD",
          payload_json: { word: "word2", context: "ctx2" },
        },
      ]);

      // Act
      await service.advancePhase(sessionId, userId, "FINISHED");

      // Assert
      expect(srsService.scheduleNextReview).toHaveBeenCalledTimes(2);
      expect(srsService.scheduleNextReview).toHaveBeenCalledWith(
        userId,
        contentId,
        "word1",
        "ctx1",
      );
      expect(srsService.scheduleNextReview).toHaveBeenCalledWith(
        userId,
        contentId,
        "word2",
        "ctx2",
      );
    });

    it("should not fail session finish if SRS scheduling fails", async () => {
      // Arrange
      mockAdvancePhaseUseCase.execute.mockResolvedValue(mockSessionUpdated);
      prisma.session_events.findMany.mockResolvedValue([
        {
          eventType: "MARK_UNKNOWN_WORD", // Note: simplified mock
          payload_json: { word: "fail", context: "ctx" },
        },
      ]);
      srsService.scheduleNextReview.mockRejectedValue(new Error("SRS Error"));

      // Act & Assert
      await expect(
        service.advancePhase(sessionId, userId, "FINISHED"),
      ).resolves.toEqual(mockSessionUpdated);
      // Verify validation/logging (implicitly by not throwing)
    });

    it("should deduplicate calls if same word appears twice? (Implementation Note: Loop currently processes all events)", async () => {
      // Current implementation processes ALL events. Deduplication logic is inside SrsService logic (not tested here, or assumed service handles calls)
      // But let's verify behavior: if 2 events same word, it calls service 2 times.

      // Arrange
      mockAdvancePhaseUseCase.execute.mockResolvedValue(mockSessionUpdated);
      srsService.scheduleNextReview.mockResolvedValue(null); // Reset mock to success
      prisma.session_events.findMany.mockResolvedValue([
        {
          eventType: "MARK_UNKNOWN_WORD",
          payload_json: { word: "same", context: "c1" },
        },
        {
          eventType: "MARK_UNKNOWN_WORD",
          payload_json: { word: "same", context: "c2" },
        },
      ]);

      // Act
      await service.advancePhase(sessionId, userId, "FINISHED");

      // Assert
      expect(srsService.scheduleNextReview).toHaveBeenCalledTimes(2);
    });
  });
});
