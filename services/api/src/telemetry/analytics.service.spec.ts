import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AnalyticsService - SCRIPT 07", () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            telemetry_events: {
              findMany: jest.fn(),
            },
            reading_sessions: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("getScript07Metrics", () => {
    it("should return all 5 metrics", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      // Mock empty data for simplicity
      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([]);
      jest.spyOn(prisma.reading_sessions, "count").mockResolvedValue(0);

      const result = await service.getScript07Metrics(from, to);

      expect(result).toHaveProperty("syntaxUsageRate");
      expect(result).toHaveProperty("summaryImprovement");
      expect(result).toHaveProperty("writingClarity");
      expect(result).toHaveProperty("fadingHealth");
      expect(result).toHaveProperty("checkpointCorrelation");
    });
  });

  describe("calculateSyntaxUsageRate", () => {
    it("should calculate 0% when no sessions exist", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([]);
      jest.spyOn(prisma.reading_sessions, "count").mockResolvedValue(0);

      const result = await service["calculateSyntaxUsageRate"](from, to);

      expect(result.percentage).toBe(0);
      expect(result.sessionsWithSyntax).toBe(0);
      expect(result.totalSessions).toBe(0);
    });

    it("should calculate correct percentage when sessions exist", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      // Mock 2 sessions with syntax analysis out of 10 total
      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([
        {
          session_id: "session1",
          data: { kind: "SENTENCE_ANALYSIS_COMPLETED" },
        },
        {
          session_id: "session2",
          data: { kind: "SENTENCE_ANALYSIS_COMPLETED" },
        },
        {
          session_id: "session3",
          data: { kind: "OTHER_EVENT" },
        },
      ] as any);
      jest.spyOn(prisma.reading_sessions, "count").mockResolvedValue(10);

      const result = await service["calculateSyntaxUsageRate"](from, to);

      expect(result.percentage).toBe(20); // 2/10 * 100 = 20%
      expect(result.sessionsWithSyntax).toBe(2);
      expect(result.totalSessions).toBe(10);
    });
  });

  describe("calculateSummaryImprovement", () => {
    it("should return zeros when no production events exist", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([]);

      const result = await service["calculateSummaryImprovement"](from, to);

      expect(result.avgLengthWithSyntax).toBe(0);
      expect(result.avgLengthWithoutSyntax).toBe(0);
      expect(result.lengthImprovement).toBe(0);
    });

    it("should calculate proposition density correctly", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      // First call: syntax users
      // Second call: production events
      jest
        .spyOn(prisma.telemetry_events, "findMany")
        .mockResolvedValueOnce([
          {
            user_id: "user1",
            data: { kind: "SENTENCE_ANALYSIS_COMPLETED" },
          },
        ] as any)
        .mockResolvedValueOnce([
          {
            user_id: "user1",
            data: {
              text: "Eu gosto de estudar porque é importante. Portanto, estudo todos os dias.",
            },
          },
          {
            user_id: "user2",
            data: { text: "Texto sem conectores relevantes aqui." },
          },
        ] as any);

      const result = await service["calculateSummaryImprovement"](from, to);

      expect(result.avgLengthWithSyntax).toBeGreaterThan(0);
      expect(result.propositionDensityWithSyntax).toBeGreaterThan(0);
    });
  });

  describe("calculateWritingClarity", () => {
    it("should return zero confidence when no syntax events exist", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([]);

      const result = await service["calculateWritingClarity"](from, to);

      expect(result.avgSyntaxConfidence).toBe(0);
    });

    it("should calculate average confidence correctly", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      // First call: syntax events with confidence
      // Second call: production events
      jest
        .spyOn(prisma.telemetry_events, "findMany")
        .mockResolvedValueOnce([
          {
            data: { kind: "SENTENCE_ANALYSIS_COMPLETED", confidence: 0.8 },
          },
          {
            data: { kind: "SENTENCE_ANALYSIS_COMPLETED", confidence: 0.9 },
          },
        ] as any)
        .mockResolvedValueOnce([]);

      const result = await service["calculateWritingClarity"](from, to);

      expect(result.avgSyntaxConfidence).toBe(0.85); // (0.8 + 0.9) / 2
    });
  });

  describe("calculateFadingHealth", () => {
    it("should return empty array when no level set events exist", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([]);

      const result = await service["calculateFadingHealth"](from, to);

      expect(result.byMode).toEqual([]);
    });

    it("should calculate fading time correctly", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      const day1 = new Date("2026-01-10");
      const day5 = new Date("2026-01-15"); // 5 days later

      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([
        {
          user_id: "user1",
          data: { toLevel: 2, mode: "NARRATIVE" },
          created_at: day1,
        },
        {
          user_id: "user1",
          data: { toLevel: 1, mode: "NARRATIVE" },
          created_at: day5,
        },
      ] as any);

      const result = await service["calculateFadingHealth"](from, to);

      expect(result.byMode).toHaveLength(1);
      expect(result.byMode[0].mode).toBe("NARRATIVE");
      expect(result.byMode[0].avgDaysToFade).toBe(5);
      expect(result.byMode[0].fadeCount).toBe(1);
    });
  });

  describe("calculateCheckpointCorrelation", () => {
    it("should return zeros when no checkpoint events exist", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      jest.spyOn(prisma.telemetry_events, "findMany").mockResolvedValue([]);

      const result = await service["calculateCheckpointCorrelation"](from, to);

      expect(result.withSyntax.avgScore).toBe(0);
      expect(result.withoutSyntax.avgScore).toBe(0);
      expect(result.improvement).toBe(0);
    });

    it("should show improvement when syntax users score higher", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");

      // First call: syntax users
      // Second call: checkpoint events
      jest
        .spyOn(prisma.telemetry_events, "findMany")
        .mockResolvedValueOnce([
          {
            user_id: "user1",
            data: { kind: "SENTENCE_ANALYSIS_COMPLETED" },
          },
        ] as any)
        .mockResolvedValueOnce([
          {
            user_id: "user1",
            data: { rubric: { comprehension: 0.9 } },
          },
          {
            user_id: "user2",
            data: { rubric: { comprehension: 0.6 } },
          },
        ] as any);

      const result = await service["calculateCheckpointCorrelation"](from, to);

      expect(result.withSyntax.avgScore).toBe(0.9);
      expect(result.withoutSyntax.avgScore).toBe(0.6);
      expect(result.improvement).toBe(0.3); // 0.9 - 0.6
    });
  });
});
