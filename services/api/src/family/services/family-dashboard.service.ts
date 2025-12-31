import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { FamilyPrivacyGuard } from "../../privacy/family-privacy-guard.service";
import { PrivacyMode, EducatorDashboardData } from "../../privacy/types";

@Injectable()
export class FamilyDashboardService {
  constructor(
    private prisma: PrismaService,
    private privacyGuard: FamilyPrivacyGuard,
  ) {}

  /**
   * Get educator dashboard with privacy filtering
   */
  async getEducatorDashboard(
    family_id: string,
    learner_user_id: string,
  ): Promise<EducatorDashboardData> {
    // Get policy to determine privacy mode
    const policy = await this.prisma.family_policies.findUnique({
      where: {
        family_id_learner_user_id: {
          family_id,
          learner_user_id,
        },
      },
    });

    const privacy_mode =
      (policy?.privacy_mode as PrivacyMode) || PrivacyMode.AGGREGATED_ONLY; // Use enum

    // Calculate aggregated stats
    const rawData = await this.calculateStats(learner_user_id);

    // Apply privacy filtering
    return this.privacyGuard.filterDashboardData(rawData, privacy_mode);
  }

  /**
   * Calculate raw stats (before privacy filtering)
   */
  private async calculateStats(
    learner_user_id: string,
  ): Promise<EducatorDashboardData> {
    // Get all reading sessions for learner
    const sessions = await this.prisma.reading_sessions.findMany({
      where: { user_id: learner_user_id },
      orderBy: { started_at: "desc" }, // Fixed: createdAt doesn't exist
      take: 30, // Last 30 sessions
    });

    // Calculate streak (consecutive days)
    const streakDays = this.calculateStreak(sessions);

    // Calculate total minutes
    const minutesTotal = sessions.reduce((sum, s) => {
      const duration = s.finished_at // Fixed: endedAt doesn't exist
        ? Math.round((s.finished_at.getTime() - s.started_at.getTime()) / 60000) // Fixed: createdAt -> startedAt
        : 0;
      return sum + duration;
    }, 0);

    // Calculate comprehension average (mock for now)
    const comprehensionAvg = 75; // TODO (Issue #3): Calculate from assessments

    // Determine trend
    const comprehensionTrend = this.calculateTrend(sessions);

    // Get top blockers (privacy-sensitive)
    const topBlockers = await this.getTopBlockers(learner_user_id);

    // Get alerts (privacy-sensitive)
    const alerts = await this.getAlerts(learner_user_id);

    return {
      streakDays,
      minutesTotal,
      comprehensionAvg,
      comprehensionTrend,
      topBlockers,
      alerts,
    };
  }

  /**
   * Calculate consecutive days streak
   */
  private calculateStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const dates = sessions.map((s) => {
      const d = new Date(s.started_at); // Fixed: createdAt -> startedAt
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    });

    const uniqueDates = [...new Set(dates)].sort().reverse();

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate comprehension trend
   */
  private calculateTrend(sessions: any[]): "UP" | "DOWN" | "FLAT" {
    // TODO (Issue #4): Implement based on assessment scores
    return "FLAT";
  }

  /**
   * Get top blockers (vocabulary, grammar, etc.)
   */
  private async getTopBlockers(learner_user_id: string): Promise<string[]> {
    // TODO (Issue #5): Analyze session events to find common struggles
    return ["vocabulary", "complex sentences"];
  }

  /**
   * Get active alerts
   */
  private async getAlerts(learner_user_id: string) {
    // TODO (Issue #6): Check for slumps, low comprehension, etc.
    return [];
  }

  /**
   * Get weekly summary for learner
   */
  async getWeeklySummary(family_id: string, learner_user_id: string) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const sessions = await this.prisma.reading_sessions.findMany({
      where: {
        user_id: learner_user_id,
        started_at: { gte: weekStart }, // Fixed: createdAt -> startedAt
      },
    });

    return {
      weekStart: weekStart.toISOString(),
      sessionCount: sessions.length,
      minutesTotal: sessions.reduce((sum, s) => {
        const duration = s.finished_at // Fixed: endedAt doesn't exist
          ? Math.round(
              (s.finished_at.getTime() - s.started_at.getTime()) / 60000,
            ) // Fixed: createdAt -> startedAt
          : 0;
        return sum + duration;
      }, 0),
      comprehensionAvg: 75, // TODO: Calculate
      topBlockers: await this.getTopBlockers(learner_user_id),
      actions: [
        "Continuar prática diária",
        "Focar em vocabulário",
        "Tentar textos mais curtos",
      ],
    };
  }
}
