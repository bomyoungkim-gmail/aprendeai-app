import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressStatsDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStudentProgress(userId: string): Promise<ProgressStatsDto> {
    // 1. Vocabulary Count
    const vocabCount = await this.prisma.userVocabulary.count({
      where: { userId, masteryScore: { gte: 50 } }, // Count words with some mastery
    });

    // 2. Skills Analysis (Weak vs Strong)
    // We fetch all answers for this user, including the question skills
    const answers = await this.prisma.assessmentAnswer.findMany({
      where: {
        assessmentAttempt: { userId },
      },
      include: {
        question: true,
      },
    });

    const skillMap = new Map<string, { success: number; error: number }>();

    for (const ans of answers) {
      const skills = ans.question.skills || []; // Array of strings
      for (const skill of skills) {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { success: 0, error: 0 });
        }
        const entry = skillMap.get(skill)!;
        if (ans.isCorrect) {
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

    // Sort by intensity
    weakPoints.sort((a, b) => b.errorCount - a.errorCount);
    strongPoints.sort((a, b) => b.successCount - a.successCount);

    return {
      vocabularySize: vocabCount,
      weakPoints: weakPoints.slice(0, 5), // Top 5
      strongPoints: strongPoints.slice(0, 5),
    };
  }

  async getVocabularyList(userId: string) {
    return this.prisma.userVocabulary.findMany({
      where: { userId },
      orderBy: { masteryScore: 'desc' },
      take: 50,
    });
  }
}
