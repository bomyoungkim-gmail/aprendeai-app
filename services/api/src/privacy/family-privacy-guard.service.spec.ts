import { Test, TestingModule } from "@nestjs/testing";
import { FamilyPrivacyGuard } from "./family-privacy-guard.service";
import { PrivacyMode, EducatorDashboardData } from "./types";

describe("FamilyPrivacyGuard", () => {
  let service: FamilyPrivacyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilyPrivacyGuard],
    }).compile();

    service = module.get<FamilyPrivacyGuard>(FamilyPrivacyGuard);
  });

  const mockDashboardData: EducatorDashboardData = {
    streakDays: 7,
    minutesTotal: 150,
    comprehensionAvg: 75,
    comprehensionTrend: "UP",
    topBlockers: ["vocabulary", "complex sentences"],
    alerts: [
      {
        type: "SLUMP",
        severity: "MED",
        message: "Student struggling with vocab",
      },
    ],
    detailedLogs: [{ timestamp: "2025-01-01", text: "Sample log" }],
    textualContent: "This is learner-written content",
  };

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("filterDashboardData - AGGREGATED_ONLY", () => {
    it("should show only aggregated stats", () => {
      const filtered = service.filterDashboardData(
        mockDashboardData,
        PrivacyMode.AGGREGATED_ONLY,
      );

      // Should include aggregated stats
      expect(filtered.streakDays).toBe(7);
      expect(filtered.minutesTotal).toBe(150);
      expect(filtered.comprehensionAvg).toBe(75);
      expect(filtered.comprehensionTrend).toBe("UP");

      // Should exclude sensitive data
      expect(filtered.topBlockers).toBeUndefined();
      expect(filtered.alerts).toBeUndefined();
      expect(filtered.detailedLogs).toBeUndefined();
      expect(filtered.textualContent).toBeUndefined();
    });
  });

  describe("filterDashboardData - AGGREGATED_PLUS_TRIGGERS", () => {
    it("should show aggregated stats + blockers + alerts", () => {
      const filtered = service.filterDashboardData(
        mockDashboardData,
        PrivacyMode.AGGREGATED_PLUS_TRIGGERS,
      );

      // Should include aggregated stats
      expect(filtered.streakDays).toBe(7);
      expect(filtered.comprehensionAvg).toBe(75);

      // Should include blockers and alerts
      expect(filtered.topBlockers).toEqual(["vocabulary", "complex sentences"]);
      expect(filtered.alerts).toBeDefined();
      expect(filtered.alerts?.length).toBe(1);

      // Alerts should be sanitized (no detailed messages)
      expect(filtered.alerts?.[0].type).toBe("SLUMP");
      expect(filtered.alerts?.[0].severity).toBe("MED");
      expect(filtered.alerts?.[0].message).toBeUndefined();

      // Should still exclude detailed logs and textual content
      expect(filtered.detailedLogs).toBeUndefined();
      expect(filtered.textualContent).toBeUndefined();
    });
  });

  describe("canViewField", () => {
    it("should allow aggregated fields for all modes", () => {
      expect(
        service.canViewField("streakDays", PrivacyMode.AGGREGATED_ONLY),
      ).toBe(true);
      expect(
        service.canViewField("minutesTotal", PrivacyMode.AGGREGATED_ONLY),
      ).toBe(true);
    });

    it("should deny topBlockers for AGGREGATED_ONLY", () => {
      expect(
        service.canViewField("topBlockers", PrivacyMode.AGGREGATED_ONLY),
      ).toBe(false);
    });

    it("should allow topBlockers for AGGREGATED_PLUS_TRIGGERS", () => {
      expect(
        service.canViewField(
          "topBlockers",
          PrivacyMode.AGGREGATED_PLUS_TRIGGERS,
        ),
      ).toBe(true);
    });

    it("should deny detailedLogs for all modes", () => {
      expect(
        service.canViewField("detailedLogs", PrivacyMode.AGGREGATED_ONLY),
      ).toBe(false);
      expect(
        service.canViewField(
          "detailedLogs",
          PrivacyMode.AGGREGATED_PLUS_TRIGGERS,
        ),
      ).toBe(false);
    });
  });

  describe("maskTextualContent", () => {
    it("should mask learner text", () => {
      const masked = service.maskTextualContent("Secret learner response");
      expect(masked).toBe("[Content hidden for privacy]");
    });
  });
});
