import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DailyGoalType } from "@prisma/client";
import { ActivityProgressDto, SetDailyGoalDto } from "./dto/gamification.dto";

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch in parallel
    const [dailyActivity, dailyGoal, streak, badges] = await Promise.all([
      this.prisma.daily_activities.findUnique({
        where: { user_id_date: { user_id: userId, date: today } },
      }),
      this.prisma.daily_goals.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      }),
      this.prisma.streaks.findUnique({
        where: { user_id: userId },
      }),
      this.prisma.user_badges.findMany({
        where: { user_id: userId },
        include: { badges: true },
        orderBy: { awarded_at: "desc" },
        take: 3,
      }),
    ]);

    return {
      dailyActivity: dailyActivity || {
        minutes_spent: 0,
        lessons_completed: 0,
        goal_met: false,
      },
      dailyGoal: dailyGoal || { goal_type: "MINUTES", goal_value: 90 }, // Default goal: 90 minutes
      streak: streak || { current_streak: 0, best_streak: 0, freeze_tokens: 0 },
      recentBadges: badges,
    };
  }

  async getGoalAchievements(userId: string) {
    const totalAchievements = await this.prisma.daily_activities.count({
      where: {
        user_id: userId,
        goal_met: true,
      },
    });

    return { totalAchievements };
  }

  async setDailyGoal(userId: string, dto: SetDailyGoalDto) {
    // Upsert not directly supported for goals history, usually we just create new or update active.
    // Simplifying to create a new record which acts as current.
    return this.prisma.daily_goals.create({
      data: {
        id: crypto.randomUUID(), // Need to import crypto or use uuid if available, schema seems to use string ID
        user_id: userId,
        goal_type: dto.goalType,
        goal_value: dto.goalValue,
        updated_at: new Date(),
      },
    });
  }

  async registerActivity(userId: string, dto: ActivityProgressDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get or Create Daily Activity
    let activity = await this.prisma.daily_activities.findUnique({
      where: { user_id_date: { user_id: userId, date: today } },
    });

    if (!activity) {
      activity = await this.prisma.daily_activities.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          date: today,
        },
      });
    }

    // 2. Update Stats
    const updatedActivity = await this.prisma.daily_activities.update({
      where: { id: activity.id },
      data: {
        minutes_spent: { increment: dto.minutesSpentDelta || 0 },
        // Sync with Activity metrics
        minutes_studied: { increment: dto.minutesSpentDelta || 0 },
        lessons_completed: { increment: dto.lessonsCompletedDelta || 0 },
        contents_read: { increment: dto.lessonsCompletedDelta || 0 },
      },
    });

    // 3. Check Goal
    await this.checkGoalCompletion(userId, updatedActivity);

    // 4. Update Study Session (for Hourly Analytics)
    // Don't wait for this to avoid blocking the main heatamp feedback
    this.updateSession(userId, dto).catch((e) =>
      console.error("Failed to update session:", e),
    );

    return updatedActivity;
  }

  private async checkGoalCompletion(userId: string, activity: any) {
    if (activity.goal_met) return; // Already met

    const goal = (await this.prisma.daily_goals.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    })) || { goal_type: DailyGoalType.MINUTES, goal_value: 90 }; // Default: 90 minutes

    let met = false;
    if (
      goal.goal_type === DailyGoalType.MINUTES &&
      activity.minutes_spent >= goal.goal_value
    ) {
      met = true;
    } else if (
      goal.goal_type === DailyGoalType.LESSONS &&
      activity.lessons_completed >= goal.goal_value
    ) {
      met = true;
    }

    if (met) {
      // Mark as met
      await this.prisma.daily_activities.update({
        where: { id: activity.id },
        data: { goal_met: true },
      });

      // Update Streak
      await this.updateStreak(userId, activity.date);
    }
  }

  private async updateStreak(userId: string, activityDate: Date) {
    let streak = await this.prisma.streaks.findUnique({
      where: { user_id: userId },
    });
    if (!streak) {
      streak = await this.prisma.streaks.create({
        data: {
          user_id: userId,
          updated_at: new Date(),
        },
      });
    }

    const lastMet = streak.last_goal_met_date
      ? new Date(streak.last_goal_met_date)
      : null;
    const oneDay = 24 * 60 * 60 * 1000;

    // Check if consecutive
    if (!lastMet) {
      // First time
      await this.prisma.streaks.update({
        where: { user_id: userId },
        data: {
          current_streak: 1,
          best_streak: 1,
          last_goal_met_date: activityDate,
        },
      });
    } else {
      const diff = activityDate.getTime() - lastMet.getTime();
      const diffDays = Math.floor(diff / oneDay);

      if (diffDays === 0) {
        // Same day, do nothing
      } else if (diffDays === 1) {
        // Consecutive
        const newCurrent = streak.current_streak + 1;
        await this.prisma.streaks.update({
          where: { user_id: userId },
          data: {
            current_streak: newCurrent,
            best_streak: Math.max(newCurrent, streak.best_streak),
            last_goal_met_date: activityDate,
          },
        });
      } else if (diffDays > 1) {
        // Broke streak
        // TODO (Issue #12): Implement Freeze Token Logic here
        const newCurrent = 1;
        // if (streak.freezeTokens > 0) ...

        await this.prisma.streaks.update({
          where: { user_id: userId },
          data: {
            current_streak: newCurrent,
            last_goal_met_date: activityDate,
          },
        });
      }
    }
  }

  private async updateSession(userId: string, dto: ActivityProgressDto) {
    const now = new Date();
    const threshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

    // 1. Find active session (ended recently)
    const recentSession = await this.prisma.study_sessions.findFirst({
      where: {
        user_id: userId,
        end_time: { gte: threshold },
      },
      orderBy: { end_time: "desc" },
    });

    const deltaMinutes = dto.minutesSpentDelta || 0;
    // Default score 100 for reading (focus mode), or use provided score (games)
    const newScore = dto.focusScore !== undefined ? dto.focusScore : 100;

    if (recentSession) {
      // 2. Resume Session
      // Weighted average for focus score
      // (oldScore * oldDuration + newScore * newDelta) / (oldDuration + newDelta)
      const currentDuration = recentSession.duration_minutes || 0; // minutes
      const totalDuration = currentDuration + deltaMinutes;

      let avgScore = 100;
      if (totalDuration > 0) {
        const currentScore = recentSession.focus_score || 100;
        avgScore =
          (currentScore * currentDuration + newScore * deltaMinutes) /
          totalDuration;
      }

      await this.prisma.study_sessions.update({
        where: { id: recentSession.id },
        data: {
          end_time: now,
          duration_minutes: { increment: deltaMinutes },
          net_focus_minutes: { increment: deltaMinutes }, // Assuming only focused time is sent
          focus_score: avgScore,
          // accuracyRate: update if provided? For now, simplistic.
        },
      });
    } else {
      // 3. New Session
      await this.prisma.study_sessions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          start_time: now,
          end_time: now,
          duration_minutes: deltaMinutes,
          net_focus_minutes: deltaMinutes,
          focus_score: newScore,
          activity_type: dto.activityType || "reading",
          // interactionCount: dto.lessonsCompletedDelta || 0, // Not in schema yet
        },
      });
    }
  }
}
