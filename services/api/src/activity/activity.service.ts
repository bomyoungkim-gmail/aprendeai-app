import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { differenceInDays, startOfDay, subDays } from "date-fns";

export interface ActivityStats {
  totalDays: number;
  activeTopics: number; // New: count of distinct topics studied recently
  currentStreak: number;
  longestStreak: number;
  avgMinutesPerDay: number;
  thisWeekMinutes: number;
  thisMonthMinutes: number;
}

export interface HeatmapData {
  date: string;
  minutesStudied: number;
  sessionsCount: number;
  contentsRead: number;
  annotationsCreated: number;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track user activity for today
   */
  async trackActivity(
    userId: string,
    type: "study" | "annotation" | "read" | "session",
    minutes: number = 1,
  ) {
    const today = startOfDay(new Date());

    try {
      await this.prisma.dailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          minutesStudied: type === "study" ? minutes : 0,
          sessionsCount: type === "session" ? 1 : 0,
          contentsRead: type === "read" ? 1 : 0,
          annotationsCreated: type === "annotation" ? 1 : 0,
        },
        update: {
          minutesStudied: type === "study" ? { increment: minutes } : undefined,
          sessionsCount: type === "session" ? { increment: 1 } : undefined,
          contentsRead: type === "read" ? { increment: 1 } : undefined,
          annotationsCreated:
            type === "annotation" ? { increment: 1 } : undefined,
        },
      });

      this.logger.log(`Tracked ${type} activity for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to track activity: ${error.message}`);
      // Don't throw - tracking shouldn't block user actions
    }
  }

  /**
   * Get activity heatmap data for last N days
   */
  async getActivityHeatmap(
    userId: string,
    days: number = 365,
  ): Promise<HeatmapData[]> {
    const startDate = subDays(new Date(), days);

    const activities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return activities.map((activity) => ({
      date: activity.date.toISOString().split("T")[0],
      minutesStudied: activity.minutesStudied,
      sessionsCount: activity.sessionsCount,
      contentsRead: activity.contentsRead,
      annotationsCreated: activity.annotationsCreated,
    }));
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(userId: string): Promise<ActivityStats> {
    const oneYearAgo = subDays(new Date(), 365);
    const sevenDaysAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const activities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: oneYearAgo,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate total days
    const totalDays = activities.length;

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak(activities);

    // Calculate longest streak
    const longestStreak = this.calculateLongestStreak(activities);

    // Calculate average minutes per day
    const totalMinutes = activities.reduce(
      (sum, a) => sum + a.minutesStudied,
      0,
    );
    const avgMinutesPerDay =
      totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    // Calculate this week minutes
    const thisWeekMinutes = activities
      .filter((a) => new Date(a.date) >= sevenDaysAgo)
      .reduce((sum, a) => sum + a.minutesStudied, 0);

    // Calculate this month minutes
    const thisMonthMinutes = activities
      .filter((a) => new Date(a.date) >= thirtyDaysAgo)
      .reduce((sum, a) => sum + a.minutesStudied, 0);

    // Calculate active topics (distinct topics studied in last 7 days)
    const activeTopics = await this.getActiveTopicsCount(userId, sevenDaysAgo);

    return {
      totalDays,
      activeTopics,
      currentStreak,
      longestStreak,
      avgMinutesPerDay,
      thisWeekMinutes,
      thisMonthMinutes,
    };
  }

  /**
   * Get count of distinct topics studied in the last N days
   */
  private async getActiveTopicsCount(userId: string, since: Date): Promise<number> {
    const topics = await this.prisma.userTopicMastery.findMany({
      where: {
        userId,
        lastActivityAt: {
          gte: since,
        },
      },
      select: {
        topic: true,
      },
      distinct: ['topic'],
    });

    return topics.length;
  }

  /**
   * Calculate current streak (consecutive days from today backwards)
   */
  private calculateCurrentStreak(
    activities: Array<{ date: Date; minutesStudied: number }>,
  ): number {
    if (activities.length === 0) return 0;

    const today = startOfDay(new Date());
    let streak = 0;

    // Check if today or yesterday has activity
    const hasToday = activities.some(
      (a) => differenceInDays(today, new Date(a.date)) === 0,
    );
    const hasYesterday = activities.some(
      (a) => differenceInDays(today, new Date(a.date)) === 1,
    );

    if (!hasToday && !hasYesterday) return 0;

    // Count backwards from today
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i);
      const hasActivity = activities.some(
        (a) => differenceInDays(checkDate, new Date(a.date)) === 0,
      );

      if (hasActivity) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate longest streak ever
   */
  private calculateLongestStreak(
    activities: Array<{ date: Date; minutesStudied: number }>,
  ): number {
    if (activities.length === 0) return 0;

    const sorted = activities.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const daysDiff = differenceInDays(
        new Date(sorted[i].date),
        new Date(sorted[i - 1].date),
      );

      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }
}
