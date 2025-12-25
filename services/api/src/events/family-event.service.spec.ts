import { Test, TestingModule } from "@nestjs/testing";
import { FamilyEventService } from "./family-event.service";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";

describe("FamilyEventService", () => {
  let service: FamilyEventService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sessionEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyEventService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FamilyEventService>(FamilyEventService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("logPolicySet", () => {
    it("should persist FAMILY_POLICY_SET event", async () => {
      const mockEvent = {
        domain: "FAMILY" as const,
        type: "FAMILY_POLICY_SET" as const,
        data: {
          householdId: "hh_123",
          learnerUserId: "user_456",
          policy: {
            timeboxDefaultMin: 15,
            coReadingDays: [1, 3, 5],
            coReadingTime: "20:00",
            toolWordsGateEnabled: true,
            dailyMinMinutes: 15,
            dailyReviewCap: 20,
            privacyMode: "AGGREGATED_ONLY" as const,
          },
        },
      };

      mockPrismaService.sessionEvent.create.mockResolvedValue({
        id: "event_1",
        sessionId: "session_1",
        userId: "user_456",
        payloadJson: mockEvent,
      });

      const result = await service.logPolicySet(
        "550e8400-e29b-41d4-a716-446655440000",
        "user_456",
        mockEvent,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.sessionEvent.create).toHaveBeenCalledWith({
        data: {
          readingSessionId: "550e8400-e29b-41d4-a716-446655440000",
          eventType: "FAMILY_POLICY_SET",
          payloadJson: mockEvent,
        },
      });
    });

    it("should reject invalid event payload", async () => {
      const invalidEvent = {
        domain: "FAMILY",
        type: "FAMILY_POLICY_SET",
        data: {
          householdId: "hh_123",
          // Missing required fields
        },
      };

      await expect(
        service.logPolicySet("session_1", "user_456", invalidEvent as any),
      ).rejects.toThrow();
    });
  });

  describe("logCoSessionStarted", () => {
    it("should persist CO_SESSION_STARTED event", async () => {
      const mockEvent = {
        domain: "FAMILY" as const,
        type: "CO_SESSION_STARTED" as const,
        data: {
          householdId: "hh_123",
          coSessionId: "co_789",
          learnerUserId: "learner_1",
          educatorUserId: "educator_1",
          readingSessionId: "rs_001",
          contentId: "content_xyz",
          timeboxMin: 20,
        },
      };

      mockPrismaService.sessionEvent.create.mockResolvedValue({
        id: "event_2",
        payloadJson: mockEvent,
      });

      await service.logCoSessionStarted("session_1", "user_1", mockEvent);

      expect(mockPrismaService.sessionEvent.create).toHaveBeenCalled();
    });
  });

  describe("getSessionEvents", () => {
    it("should query FAMILY events for a session", async () => {
      mockPrismaService.sessionEvent.findMany.mockResolvedValue([
        {
          id: "1",
          payloadJson: { domain: "FAMILY", type: "CO_SESSION_STARTED" },
        },
      ]);

      const events = await service.getSessionEvents("session_1");

      expect(events).toHaveLength(1);
      expect(mockPrismaService.sessionEvent.findMany).toHaveBeenCalledWith({
        where: {
          readingSessionId: "session_1",
          payloadJson: {
            path: ["domain"],
            equals: "FAMILY",
          },
        },
        orderBy: { createdAt: "asc" },
      });
    });
  });
});
