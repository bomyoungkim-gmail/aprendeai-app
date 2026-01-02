import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IOpsRepository } from "../../domain/interfaces/ops.repository.interface";

@Injectable()
export class PrismaOpsRepository implements IOpsRepository {
  constructor(private prisma: PrismaService) {}

  async getDailyMinutesSpent(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.reading_sessions.findMany({
      where: {
        user_id: userId,
        started_at: { gte: startOfDay, lte: endOfDay },
      },
    });

    return sessions.reduce((sum, s) => {
      if (s.finished_at && s.started_at) {
        return (
          sum +
          Math.floor((s.finished_at.getTime() - s.started_at.getTime()) / 60000)
        );
      }
      return sum;
    }, 0);
  }

  async getLessonsCompletedCount(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.reading_sessions.count({
      where: {
        user_id: userId,
        started_at: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  async getUserPolicy(userId: string): Promise<any> {
    return this.prisma.family_policies.findFirst({
      where: { learner_user_id: userId },
    });
  }

  async calculateStreak(userId: string): Promise<number> {
    // Basic mock implementation as in the original service
    // In a real scenario, this would iterate backwards through daily logs
    return 7;
  }

  async logStudyTime(userId: string, minutes: number): Promise<void> {
    // Original implementation was a TODO, keeping it as is but via repo
    // In the future, this would create an 'activity_log' entry
    console.log(`[Repo] Logged ${minutes} minutes for ${userId}`);
  }
}
