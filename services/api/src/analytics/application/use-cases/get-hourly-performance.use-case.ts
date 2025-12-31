import { Injectable, Inject } from '@nestjs/common';
import { IAnalyticsRepository } from '../../domain/analytics.repository.interface';

@Injectable()
export class GetHourlyPerformanceUseCase {
  constructor(
    @Inject(IAnalyticsRepository)
    private readonly repository: IAnalyticsRepository,
  ) {}

  async execute(userId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const hourlyData = await this.repository.getHourlyPerformance(userId, since);

    const transformed = hourlyData.map((row) => ({
      hour: row.hour,
      avgAccuracy: row.avg_accuracy || 0,
      avgFocusScore: row.avg_focus_score || 0,
      sessionCount: Number(row.total_sessions),
      totalMinutes: Number(row.total_minutes),
    }));

    const ranked = [...transformed].sort(
      (a, b) => b.avgFocusScore - a.avgFocusScore,
    );
    const peakHours = ranked.slice(0, 3).map((r) => r.hour);

    return {
      hourlyBreakdown: transformed,
      peakHours,
      daysAnalyzed: days,
    };
  }
}
