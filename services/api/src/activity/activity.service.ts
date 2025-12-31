import { Injectable, Inject } from "@nestjs/common";
import { TrackActivityUseCase } from "./application/use-cases/track-activity.use-case";
import { GetActivityStatsUseCase } from "./application/use-cases/get-activity-stats.use-case";
import { IActivityRepository } from "./domain/interfaces/activity.repository.interface";
import { HeatmapData } from "./domain/entities/activity.entity";

export { ActivityStats, HeatmapData } from "./domain/entities/activity.entity";

@Injectable()
export class ActivityService {
  constructor(
    private readonly trackActivityUseCase: TrackActivityUseCase,
    private readonly getActivityStatsUseCase: GetActivityStatsUseCase,
    @Inject(IActivityRepository)
    private readonly activityRepo: IActivityRepository,
  ) {}

  /**
   * Track user activity for today
   */
  async trackActivity(
    userId: string,
    type: "study" | "annotation" | "read" | "session",
    minutes: number = 1,
  ) {
    return this.trackActivityUseCase.execute(userId, type, minutes);
  }

  /**
   * Get activity heatmap data for last N days
   */
  async getActivityHeatmap(
    userId: string,
    days: number = 365,
  ): Promise<HeatmapData[]> {
    const activities = await this.activityRepo.getActivityHeatmap(userId, days);
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
  async getActivityStats(userId: string) {
    return this.getActivityStatsUseCase.execute(userId);
  }
}
