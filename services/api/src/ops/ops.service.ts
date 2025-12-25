import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OpsCoachService } from "../family/services/ops-coach.service";
import { FamilyPolicyService } from "../family/services/family-policy.service";
import {
  DailySnapshotDto,
  TaskDto,
  ContextCardDto,
  LogTimeDto,
} from "./dto/ops.dto";
import { FAMILY_CONFIG } from "../config/family-classroom.config";

@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opsCoach: OpsCoachService,
    private readonly policyService: FamilyPolicyService,
  ) {}

  /**
   * Get comprehensive daily snapshot
   */
  async getDailySnapshot(userId: string): Promise<DailySnapshotDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's sessions
    const sessions = await this.prisma.readingSession.findMany({
      where: {
        userId,
        startedAt: { gte: today },
      },
    });

    // Calculate progress (duration = finishedAt - startedAt)
    const minutesToday = sessions.reduce((sum, s) => {
      if (s.finishedAt && s.startedAt) {
        const duration = Math.floor(
          (s.finishedAt.getTime() - s.startedAt.getTime()) / 60000,
        );
        return sum + duration;
      }
      return sum;
    }, 0);
    const lessonsCompleted = sessions.length;

    // Get user's policy for goals
    const policies = await this.prisma.familyPolicy.findMany({
      where: { learnerUserId: userId },
      take: 1,
    });

    const policy = policies[0];
    const dailyMinutes =
      policy?.dailyMinMinutes || FAMILY_CONFIG.POLICY.DEFAULT_DAILY_MIN_MINUTES;

    // Get streak
    const streakDays = await this.calculateStreak(userId);

    // Get next tasks
    const nextTasks = await this.getWhatsNext(userId);

    return {
      userId,
      date: new Date(),
      progress: {
        minutesToday,
        lessonsCompleted,
        comprehensionAvg: 0, // TODO: Calculate from assessments
        streakDays,
        goalMet: minutesToday >= dailyMinutes,
      },
      goals: {
        dailyMinutes,
        goalType: "MINUTES",
      },
      nextTasks,
    };
  }

  /**
   * Get prioritized next tasks
   */
  async getWhatsNext(userId: string): Promise<TaskDto[]> {
    const tasks: TaskDto[] = [];

    // Check for due SRS reviews
    // TODO (Issue #8): Uncomment when Vocab model is created
    const dueReviews = 0; // await this.prisma.vocab.count({ where: { userId } });

    if (dueReviews > 0) {
      tasks.push({
        id: "review-vocab",
        title: "Review Vocabulary",
        description: `${dueReviews} cards waiting`,
        estimatedMin: Math.min(dueReviews * 2, 30),
        type: "REVIEW",
        ctaUrl: "/dashboard/review",
        priority: "HIGH",
      });
    }

    // Check for co-reading (if it's a scheduled day)
    const policies = await this.prisma.familyPolicy.findMany({
      where: { learnerUserId: userId },
    });

    const today = new Date().getDay();
    const hasCoReading = policies.some((p) => p.coReadingDays?.includes(today));

    if (hasCoReading) {
      tasks.push({
        id: "co-reading",
        title: "Co-Reading Session",
        description: "Scheduled with your educator",
        estimatedMin: 20,
        type: "CO_READING",
        ctaUrl: "/dashboard/co-reading",
        priority: "HIGH",
      });
    }

    // Add continue learning if no high priority tasks
    if (tasks.length === 0) {
      tasks.push({
        id: "continue-learning",
        title: "Continue Learning",
        description: "Pick up where you left off",
        estimatedMin: 15,
        type: "LESSON",
        ctaUrl: "/dashboard/library",
        priority: "MEDIUM",
      });
    }

    return tasks.slice(0, 3); // Top 3 tasks
  }

  /**
   * Get context cards
   */
  async getContextCards(userId: string): Promise<ContextCardDto[]> {
    const cards: ContextCardDto[] = [];
    const today = new Date().getDay();

    // Co-Reading reminder
    const policies = await this.prisma.familyPolicy.findMany({
      where: { learnerUserId: userId },
    });

    const hasCoReading = policies.some((p) => p.coReadingDays?.includes(today));
    if (hasCoReading) {
      cards.push({
        id: "co-reading-reminder",
        type: "CO_READING",
        title: "🗓️ Co-Reading Time!",
        message: "You have a co-reading session scheduled for today.",
        ctaText: "Start Session",
        ctaUrl: "/families/co-sessions/start",
        color: "blue",
      });
    }

    // Review due
    // TODO (Issue #8): Uncomment when Vocab model is created
    const dueReviews = 0; // await this.prisma.vocab.count({ where: { userId } });

    if (dueReviews >= 10) {
      cards.push({
        id: "review-due",
        type: "REVIEW_DUE",
        title: "📚 Reviews Waiting",
        message: `You have ${dueReviews} vocabulary cards ready to review.`,
        ctaText: "Review Now",
        ctaUrl: "/dashboard/review",
        color: "green",
      });
    }

    // Weekly plan (Sundays)
    if (today === 0) {
      cards.push({
        id: "weekly-plan",
        type: "WEEKLY_PLAN",
        title: "📅 Plan Your Week",
        message: "Take a moment to set your goals for the week ahead.",
        ctaText: "Create Plan",
        ctaUrl: "/dashboard/planning",
        color: "purple",
      });
    }

    return cards;
  }

  /**
   * Log time
   */
  async logTime(userId: string, dto: LogTimeDto) {
    // TODO: Implement time logging to ActivityLog or similar
    return {
      success: true,
      message: `Logged ${dto.minutes} minutes`,
    };
  }

  /**
   * Get boot prompt
   */
  async getBootPrompt(userId: string) {
    return this.opsCoach.getDailyBootLearner();
  }

  /**
   * Get close prompt
   */
  async getClosePrompt(userId: string) {
    return this.opsCoach.getDailyCloseLearner();
  }

  /**
   * Calculate streak
   */
  private async calculateStreak(userId: string): Promise<number> {
    // TODO: Implement proper streak calculation
    return 7; // Mock
  }
}
