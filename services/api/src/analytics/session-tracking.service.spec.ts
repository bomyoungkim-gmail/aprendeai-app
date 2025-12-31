import { Test, TestingModule } from "@nestjs/testing";
import { SessionTrackingService } from "./session-tracking.service";
import { PrismaService } from "../prisma/prisma.service";

describe("SessionTrackingService", () => {
  let service: SessionTrackingService;
  let prismaService: PrismaService;

  const mockPrisma = {
    study_sessions: {
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

  describe("handleSessionStart", () => {
    it("should create a new study session", async () => {
      const event = {
        user_id: "user-123",
        activity_type: "game" as const,
        content_id: "content-456",
      };

      const mockSession = {
        id: "session-789",
        user_id: event.user_id,
        activity_type: event.activity_type,
        start_time: new Date(),
      };

      mockPrisma.study_sessions.create.mockResolvedValue(mockSession);

      const result = await service.handleSessionStart(event);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.study_sessions.create).toHaveBeenCalledWith({
        data: {
          user_id: event.user_id,
          activity_type: event.activity_type,
          content_id: event.content_id,
          source_id: undefined,
          start_time: expect.any(Date),
        },
      });
    });
  });

  describe("handleSessionFinish", () => {
    it("should update session with duration and metrics", async () => {
      const event = {
        sessionId: "session-789",
        duration_minutes: 60,
        net_focus_minutes: 40,
        accuracy_rate: 85,
      };

      const mockUpdate = {
        id: event.sessionId,
        end_time: new Date(),
        duration_minutes: 60,
        net_focus_minutes: 40,
        focus_score: 66.67, // (40/60)*100
        accuracy_rate: 85,
      };

      mockPrisma.study_sessions.update.mockResolvedValue(mockUpdate);

      await service.handleSessionFinish(event);

      expect(mockPrisma.study_sessions.update).toHaveBeenCalledWith({
        where: { id: event.sessionId },
        data: {
          end_time: expect.any(Date),
          duration_minutes: 60,
          net_focus_minutes: 40,
          interruptions: undefined,
          focus_score: expect.closeTo(66.67, 1),
          accuracy_rate: 85,
          engagement_score: undefined,
        },
      });
    });

    it("should calculate focus score correctly", async () => {
      const event = {
        sessionId: "session-123",
        duration_minutes: 100,
        net_focus_minutes: 25,
      };

      mockPrisma.study_sessions.update.mockResolvedValue({});

      await service.handleSessionFinish(event);

      const call = mockPrisma.study_sessions.update.mock.calls[0][0];
      expect(call.data.focus_score).toBeCloseTo(25, 1); // 25/100 * 100 = 25%
    });

    it("should handle zero duration gracefully", async () => {
      const event = {
        sessionId: "session-123",
        duration_minutes: 0,
        net_focus_minutes: 0,
      };

      mockPrisma.study_sessions.update.mockResolvedValue({});

      await service.handleSessionFinish(event);

      const call = mockPrisma.study_sessions.update.mock.calls[0][0];
      expect(call.data.focus_score).toBeUndefined(); // Avoid division by zero
    });
  });

  describe("handleSessionHeartbeat", () => {
    it("should increment interruptions on blur status", async () => {
      const event = {
        sessionId: "session-123",
        status: "blurred" as const,
      };

      mockPrisma.study_sessions.update.mockResolvedValue({});

      await service.handleSessionHeartbeat(event);

      expect(mockPrisma.study_sessions.update).toHaveBeenCalledWith({
        where: { id: "session-123" },
        data: {
          interruptions: { increment: 1 },
        },
      });
    });

    it("should not increment interruptions on focused status", async () => {
      const event = {
        sessionId: "session-123",
        status: "focused" as const,
      };

      await service.handleSessionHeartbeat(event);

      expect(mockPrisma.study_sessions.update).not.toHaveBeenCalled();
    });
  });

  describe("autoCloseAbandonedSessions", () => {
    it("should close sessions older than threshold", async () => {
      const oldSession = {
        id: "old-session",
        userId: "user-123",
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        endTime: null,
      };

      mockPrisma.study_sessions.findMany.mockResolvedValue([oldSession]);
      mockPrisma.study_sessions.update.mockResolvedValue({});

      const count = await service.autoCloseAbandonedSessions(30); // 30 min threshold

      expect(count).toBe(1);
      expect(mockPrisma.study_sessions.update).toHaveBeenCalledWith({
        where: { id: "old-session" },
        data: expect.objectContaining({
          end_time: expect.any(Date),
          duration_minutes: expect.any(Number),
          focus_score: 20, // Low score for abandoned
        }),
      });
    });
  });
});
