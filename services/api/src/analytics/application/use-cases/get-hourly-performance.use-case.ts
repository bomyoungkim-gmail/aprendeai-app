import { Injectable, Inject } from "@nestjs/common";
import { IAnalyticsRepository } from "../../domain/analytics.repository.interface";
import { HourlyActivityCacheService } from "../services/hourly-activity-cache.service";

@Injectable()
export class GetHourlyPerformanceUseCase {
  constructor(
    @Inject(IAnalyticsRepository)
    private readonly repository: IAnalyticsRepository,
    private readonly cacheService: HourlyActivityCacheService,
  ) {}

  async execute(userId: string, days: number = 30) {
    const period = days > 30 ? '360d' : '30d';

    // 1. Try to get cached data
    let cachedData = await this.cacheService.getCachedData(userId, period);

    // 2. If empty, rebuild cache and try again
    if (cachedData.length === 0) {
      await this.cacheService.rebuildCacheForUser(userId, period);
      cachedData = await this.cacheService.getCachedData(userId, period);
    }

    // 3. Transform cached data for frontend
    const transformed = cachedData.map((row) => {
      const [h, m] = row.time_slot.split(':').map(Number);
      return {
        time_slot: row.time_slot,
        hour: h,
        minute: m,
        avgAccuracy: 0,
        avgFocusScore: 0,
        sessionCount: row.minutes,
        totalMinutes: row.minutes,
      };
    });

    // Rank by Frequency (Minutes)
    const ranked = [...transformed].sort(
      (a, b) => b.sessionCount - a.sessionCount,
    );
    const peakHours = ranked.slice(0, 3).map((r) => ({ time_slot: r.time_slot }));

    return {
      hourlyBreakdown: transformed,
      peakHours,
      daysAnalyzed: days,
    };
  }
}
