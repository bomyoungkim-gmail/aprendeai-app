import { Injectable, Inject } from "@nestjs/common";
import { IAnalyticsRepository } from "../../domain/analytics.repository.interface";
import { ProgressStatsDto } from "../../dto/analytics.dto";

@Injectable()
export class GetStudentProgressUseCase {
  constructor(
    @Inject(IAnalyticsRepository) private readonly repository: IAnalyticsRepository,
  ) {}

  async execute(userId: string): Promise<ProgressStatsDto> {
    const vocabCount = await this.repository.countMasteredVocab(userId, 50);
    const answers = await this.repository.getAssessmentAnswers(userId);

    const skillMap = new Map<string, { success: number; error: number }>();

    for (const ans of answers) {
      const skills = (ans.assessment_questions as any).skills || [];
      for (const skill of skills) {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { success: 0, error: 0 });
        }
        const entry = skillMap.get(skill)!;
        if (ans.is_correct) {
          entry.success++;
        } else {
          entry.error++;
        }
      }
    }

    const weakPoints: { skill: string; errorCount: number }[] = [];
    const strongPoints: { skill: string; successCount: number }[] = [];

    skillMap.forEach((stats, skill) => {
      if (stats.error > stats.success) {
        weakPoints.push({ skill, errorCount: stats.error });
      } else {
        strongPoints.push({ skill, successCount: stats.success });
      }
    });

    weakPoints.sort((a, b) => b.errorCount - a.errorCount);
    strongPoints.sort((a, b) => b.successCount - a.successCount);

    return {
      vocabularySize: vocabCount,
      weakPoints: weakPoints.slice(0, 5),
      strongPoints: strongPoints.slice(0, 5),
    };
  }
}
