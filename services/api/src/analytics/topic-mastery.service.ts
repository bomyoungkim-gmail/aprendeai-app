import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TopicMasteryService {
  private readonly logger = new Logger(TopicMasteryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates the user's mastery level, streak, and time spent for a specific topic/subject.
   * Logic:
   *  - Mastery: +Gain on success (with streak bonus), -Penalty on failure.
   *  - Streak: Increments on success, resets on failure.
   *  - Time: Always accumulates.
   */
  async updateMastery(
    userId: string,
    topic: string,
    subject: string,
    isCorrect: boolean,
    timeSpentSeconds: number = 0,
  ) {
    try {
      const masteryRecord = await this.prisma.user_topic_mastery.findUnique({
        where: { user_id_topic_subject: { user_id: userId, topic, subject } },
      });

      let newMastery = masteryRecord?.mastery_level || 0;
      const newStreak = isCorrect ? (masteryRecord?.streak || 0) + 1 : 0;

      // Mastery Calculation logic
      if (isCorrect) {
        // Base gain (5%) + streak bonus (max 5%)
        const gain = 5 + Math.min(newStreak, 5);
        newMastery = Math.min(100, newMastery + gain);
      } else {
        // Penalty (-2%)
        newMastery = Math.max(0, newMastery - 2);
      }

      // Upsert
      // Upsert
      // Import uuid
      const { v4: uuidv4 } = require("uuid");
      await this.prisma.user_topic_mastery.upsert({
        where: { user_id_topic_subject: { user_id: userId, topic, subject } },
        create: {
          id: uuidv4(),
          user_id: userId,
          topic,
          subject,
          mastery_level: newMastery,
          streak: newStreak,
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          time_spent: timeSpentSeconds,
          updated_at: new Date(),
        },
        update: {
          mastery_level: newMastery,
          streak: newStreak,
          questions_attempted: { increment: 1 },
          questions_correct: { increment: isCorrect ? 1 : 0 },
          time_spent: { increment: timeSpentSeconds },
          last_activity_at: new Date(),
          updated_at: new Date(),
        },
      });

      this.logger.debug(
        `Updated mastery for user ${userId} on ${topic}: ${newMastery}%`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update topic mastery for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves mastery overview for a user.
   */
  async getUserMastery(userId: string) {
    return this.prisma.user_topic_mastery.findMany({
      where: { user_id: userId },
      orderBy: { last_activity_at: "desc" },
    });
  }

  /**
   * Retrieves the user's weakest topics (low mastery) to recommend content.
   */
  async getWeakestTopics(userId: string, limit: number = 5) {
    return this.prisma.user_topic_mastery.findMany({
      where: {
        user_id: userId,
        mastery_level: { lt: 70 }, // threshold for "weak"
      },
      orderBy: [
        { mastery_level: "asc" }, // Lowest mastery first
        { last_activity_at: "asc" }, // Or least recently practiced
      ],
      take: limit,
    });
  }
}
