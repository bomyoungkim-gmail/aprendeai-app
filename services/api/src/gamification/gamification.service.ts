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
      this.prisma.dailyActivity.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      this.prisma.dailyGoal.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.streak.findUnique({
        where: { userId },
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
        take: 3,
      }),
    ]);

    return {
      dailyActivity: dailyActivity || {
        minutesSpent: 0,
        lessonsCompleted: 0,
        goalMet: false,
      },
      dailyGoal: dailyGoal || { goalType: "MINUTES", goalValue: 90 }, // Default goal: 90 minutes
      streak: streak || { currentStreak: 0, bestStreak: 0, freezeTokens: 0 },
      recentBadges: badges,
    };
  }

  async getGoalAchievements(userId: string) {
    const totalAchievements = await this.prisma.dailyActivity.count({
      where: {
        userId,
        goalMet: true,
      },
    });

    return { totalAchievements };
  }

  async setDailyGoal(userId: string, dto: SetDailyGoalDto) {
    // Upsert not directly supported for goals history, usually we just create new or update active.
    // Simplifying to create a new record which acts as current.
    return this.prisma.dailyGoal.create({
      data: {
        userId,
        goalType: dto.goalType,
        goalValue: dto.goalValue,
      },
    });
  }

  async registerActivity(userId: string, dto: ActivityProgressDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get or Create Daily Activity
    let activity = await this.prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!activity) {
      activity = await this.prisma.dailyActivity.create({
        data: { userId, date: today },
      });
    }

    // 2. Update Stats
    const updatedActivity = await this.prisma.dailyActivity.update({
      where: { id: activity.id },
      data: {
        minutesSpent: { increment: dto.minutesSpentDelta || 0 },
        // Sync with Activity metrics
        minutesStudied: { increment: dto.minutesSpentDelta || 0 },
        lessonsCompleted: { increment: dto.lessonsCompletedDelta || 0 },
        contentsRead: { increment: dto.lessonsCompletedDelta || 0 },
      },
    });

    // 3. Check Goal
    await this.checkGoalCompletion(userId, updatedActivity);

    // 4. Update Study Session (for Hourly Analytics)
    // Don't wait for this to avoid blocking the main heatamp feedback
    this.updateSession(userId, dto).catch(e => console.error('Failed to update session:', e));

    return updatedActivity;
  }

  private async checkGoalCompletion(userId: string, activity: any) {
    if (activity.goalMet) return; // Already met

    const goal = (await this.prisma.dailyGoal.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })) || { goalType: DailyGoalType.MINUTES, goalValue: 90 }; // Default: 90 minutes

    let met = false;
    if (
      goal.goalType === DailyGoalType.MINUTES &&
      activity.minutesSpent >= goal.goalValue
    ) {
      met = true;
    } else if (
      goal.goalType === DailyGoalType.LESSONS &&
      activity.lessonsCompleted >= goal.goalValue
    ) {
      met = true;
    }

    if (met) {
      // Mark as met
      await this.prisma.dailyActivity.update({
        where: { id: activity.id },
        data: { goalMet: true },
      });

      // Update Streak
      await this.updateStreak(userId, activity.date);
    }
  }

  private async updateStreak(userId: string, activityDate: Date) {
    let streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (!streak) {
      streak = await this.prisma.streak.create({ data: { userId } });
    }

    const lastMet = streak.lastGoalMetDate
      ? new Date(streak.lastGoalMetDate)
      : null;
    const oneDay = 24 * 60 * 60 * 1000;

    // Check if consecutive
    if (!lastMet) {
      // First time
      await this.prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          bestStreak: 1,
          lastGoalMetDate: activityDate,
        },
      });
    } else {
      const diff = activityDate.getTime() - lastMet.getTime();
      const diffDays = Math.floor(diff / oneDay);

      if (diffDays === 0) {
        // Same day, do nothing
      } else if (diffDays === 1) {
        // Consecutive
        const newCurrent = streak.currentStreak + 1;
        await this.prisma.streak.update({
          where: { userId },
          data: {
            currentStreak: newCurrent,
            bestStreak: Math.max(newCurrent, streak.bestStreak),
            lastGoalMetDate: activityDate,
          },
        });
      } else if (diffDays > 1) {
        // Broke streak
        // TODO (Issue #12): Implement Freeze Token Logic here
        const newCurrent = 1;
        // if (streak.freezeTokens > 0) ...

        await this.prisma.streak.update({
          where: { userId },
          data: {
            currentStreak: newCurrent,
            lastGoalMetDate: activityDate,
          },
        });
      }
    }
  }

  private async updateSession(userId: string, dto: ActivityProgressDto) {
    const now = new Date();
    const threshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

    // 1. Find active session (ended recently)
    const recentSession = await this.prisma.studySession.findFirst({
      where: {
        userId,
        endTime: { gte: threshold },
      },
      orderBy: { endTime: 'desc' },
    });

    const deltaMinutes = dto.minutesSpentDelta || 0;
    // Default score 100 for reading (focus mode), or use provided score (games)
    const newScore = dto.focusScore !== undefined ? dto.focusScore : 100;

    if (recentSession) {
      // 2. Resume Session
      // Weighted average for focus score
      // (oldScore * oldDuration + newScore * newDelta) / (oldDuration + newDelta)
      const currentDuration = recentSession.durationMinutes || 0; // minutes
      const totalDuration = currentDuration + deltaMinutes;
      
      let avgScore = 100;
      if (totalDuration > 0) {
        const currentScore = recentSession.focusScore || 100;
        avgScore = ((currentScore * currentDuration) + (newScore * deltaMinutes)) / totalDuration;
      }

      await this.prisma.studySession.update({
        where: { id: recentSession.id },
        data: {
          endTime: now,
          durationMinutes: { increment: deltaMinutes },
          netFocusMinutes: { increment: deltaMinutes }, // Assuming only focused time is sent
          focusScore: avgScore,
          // accuracyRate: update if provided? For now, simplistic.
        },
      });
    } else {
      // 3. New Session
      await this.prisma.studySession.create({
        data: {
          userId,
          startTime: now,
          endTime: now,
          durationMinutes: deltaMinutes,
          netFocusMinutes: deltaMinutes,
          focusScore: newScore,
          activityType: dto.activityType || 'reading',
          // interactionCount: dto.lessonsCompletedDelta || 0, // Not in schema yet
        },
      });
    }
  }
}
