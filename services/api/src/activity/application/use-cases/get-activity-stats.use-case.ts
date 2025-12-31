import { Injectable, Inject } from '@nestjs/common';
import { IActivityRepository } from '../../domain/interfaces/activity.repository.interface';
import { ActivityStats, Activity } from '../../domain/entities/activity.entity';
import { differenceInDays, startOfDay, subDays } from 'date-fns';

@Injectable()
export class GetActivityStatsUseCase {
  constructor(
    @Inject(IActivityRepository)
    private readonly activityRepo: IActivityRepository,
  ) {}

  async execute(userId: string): Promise<ActivityStats> {
    const oneYearAgo = subDays(new Date(), 365);
    const sevenDaysAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const activities = await this.activityRepo.getActivities(userId, oneYearAgo);

    const totalDays = activities.length;
    const currentStreak = this.calculateCurrentStreak(activities);
    const longestStreak = this.calculateLongestStreak(activities);

    const totalMinutes = activities.reduce((sum, a) => sum + a.minutesStudied, 0);
    const avgMinutesPerDay = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    const thisWeekMinutes = activities
      .filter((a) => a.date >= sevenDaysAgo)
      .reduce((sum, a) => sum + a.minutesStudied, 0);

    const thisMonthMinutes = activities
      .filter((a) => a.date >= thirtyDaysAgo)
      .reduce((sum, a) => sum + a.minutesStudied, 0);

    const activeTopics = await this.activityRepo.getActiveTopicsCount(userId, sevenDaysAgo);

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

  private calculateCurrentStreak(activities: Activity[]): number {
    if (activities.length === 0) return 0;
    const today = startOfDay(new Date());
    let streak = 0;

    const hasToday = activities.some(a => differenceInDays(today, a.date) === 0);
    const hasYesterday = activities.some(a => differenceInDays(today, a.date) === 1);

    if (!hasToday && !hasYesterday) return 0;

    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i);
      const hasActivity = activities.some(a => differenceInDays(checkDate, a.date) === 0);
      if (hasActivity) streak++;
      else break;
    }
    return streak;
  }

  private calculateLongestStreak(activities: Activity[]): number {
    if (activities.length === 0) return 0;
    const sorted = [...activities].sort((a, b) => a.date.getTime() - b.date.getTime());

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
        const daysDiff = differenceInDays(sorted[i].date, sorted[i-1].date);
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
