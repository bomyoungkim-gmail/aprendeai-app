import { Injectable, Logger } from "@nestjs/common";
import { PrivacyMode, EducatorDashboardData, Alert } from "./types";

@Injectable()
export class FamilyPrivacyGuard {
  private readonly logger = new Logger(FamilyPrivacyGuard.name);

  /**
   * Filter dashboard data based on privacy mode
   */
  filterDashboardData(
    data: EducatorDashboardData,
    privacyMode: PrivacyMode,
  ): EducatorDashboardData {
    const filtered: EducatorDashboardData = {
      // Always visible: aggregated stats
      streakDays: data.streakDays,
      minutesTotal: data.minutesTotal,
      comprehensionAvg: data.comprehensionAvg,
      comprehensionTrend: data.comprehensionTrend,
    };

    // Apply mode-specific filters
    if (privacyMode === PrivacyMode.AGGREGATED_ONLY) {
      // AGGREGATED_ONLY: Stats only, no blockers or alerts
      this.logger.debug("Filtering with AGGREGATED_ONLY mode");

      // Explicitly exclude sensitive fields
      return filtered;
    }

    if (privacyMode === PrivacyMode.AGGREGATED_PLUS_TRIGGERS) {
      // AGGREGATED_PLUS_TRIGGERS: Stats + top blockers + alerts
      this.logger.debug("Filtering with AGGREGATED_PLUS_TRIGGERS mode");

      filtered.topBlockers = data.topBlockers;
      filtered.alerts = this.sanitizeAlerts(data.alerts);

      // Still exclude detailed logs and textual content
      return filtered;
    }

    return filtered;
  }

  /**
   * Sanitize alerts: Keep type + severity, remove detailed messages
   */
  private sanitizeAlerts(alerts?: Alert[]): Alert[] | undefined {
    if (!alerts) return undefined;

    return alerts.map((alert) => ({
      type: alert.type,
      severity: alert.severity,
      // Remove message to avoid revealing learner's specific struggles
    }));
  }

  /**
   * Check if a specific data field is allowed for the given privacy mode
   */
  canViewField(
    field: keyof EducatorDashboardData,
    privacyMode: PrivacyMode,
  ): boolean {
    const alwaysAllowed: (keyof EducatorDashboardData)[] = [
      "streakDays",
      "minutesTotal",
      "comprehensionAvg",
      "comprehensionTrend",
    ];

    if (alwaysAllowed.includes(field)) {
      return true;
    }

    const triggersAllowed: (keyof EducatorDashboardData)[] = [
      "topBlockers",
      "alerts",
    ];

    if (
      privacyMode === PrivacyMode.AGGREGATED_PLUS_TRIGGERS &&
      triggersAllowed.includes(field)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Mask learner's textual responses (always prohibited for educators)
   */
  maskTextualContent(text: string): string {
    return "[Content hidden for privacy]";
  }
}
