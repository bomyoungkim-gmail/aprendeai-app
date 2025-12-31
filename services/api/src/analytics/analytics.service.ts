import { Injectable, Inject } from "@nestjs/common";
import { IAnalyticsRepository } from "./domain/analytics.repository.interface";
import { ProgressStatsDto } from "./dto/analytics.dto";
import { GetStudentProgressUseCase } from "./application/use-cases/get-student-progress.use-case";
import { GetHourlyPerformanceUseCase } from "./application/use-cases/get-hourly-performance.use-case";
import { GetQualityOverviewUseCase } from "./application/use-cases/get-quality-overview.use-case";

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(IAnalyticsRepository)
    private readonly repository: IAnalyticsRepository,
    private readonly getProgressUseCase: GetStudentProgressUseCase,
    private readonly getHourlyPerformanceUseCase: GetHourlyPerformanceUseCase,
    private readonly getQualityOverviewUseCase: GetQualityOverviewUseCase,
  ) {}

  async getStudentProgress(userId: string): Promise<ProgressStatsDto> {
    return this.getProgressUseCase.execute(userId);
  }

  async getVocabularyList(userId: string) {
    return this.repository.getVocabularyList(userId, 50);
  }

  async getHourlyPerformance(userId: string, days?: number) {
    return this.getHourlyPerformanceUseCase.execute(userId, days);
  }

  async getQualityOverview(userId: string, period?: string) {
    return this.getQualityOverviewUseCase.execute(userId, period);
  }
}
