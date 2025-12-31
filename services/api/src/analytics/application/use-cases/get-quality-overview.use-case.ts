import { Injectable, Inject } from '@nestjs/common';
import { IAnalyticsRepository } from '../../domain/analytics.repository.interface';

@Injectable()
export class GetQualityOverviewUseCase {
  constructor(
    @Inject(IAnalyticsRepository)
    private readonly repository: IAnalyticsRepository,
  ) {}

  async execute(userId: string, period?: string) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sessions = await this.repository.getQualitySessions(userId, since);

    if (sessions.length === 0) {
      return { period: days, totalSessions: 0, avgAccuracy: 0 };
    }

    const totals = sessions.reduce(
      (acc, s) => ({
        accuracy: acc.accuracy + (s.accuracy_rate || 0),
        focus: acc.focus + (s.focus_score || 0),
      }),
      { accuracy: 0, focus: 0 },
    );

    return {
      period: days,
      totalSessions: sessions.length,
      avgAccuracy: Math.round((totals.accuracy / sessions.length) * 10) / 10,
      avgFocusScore: Math.round((totals.focus / sessions.length) * 10) / 10,
    };
  }
}
