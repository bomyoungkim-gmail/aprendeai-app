import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      const masteryRecord = await this.prisma.userTopicMastery.findUnique({
        where: { userId_topic_subject: { userId, topic, subject } },
      });

      let newMastery = masteryRecord?.masteryLevel || 0;
      let newStreak = isCorrect ? (masteryRecord?.streak || 0) + 1 : 0;
      
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
      await this.prisma.userTopicMastery.upsert({
        where: { userId_topic_subject: { userId, topic, subject } },
        create: {
          userId,
          topic,
          subject,
          masteryLevel: newMastery,
          streak: newStreak,
          questionsAttempted: 1,
          questionsCorrect: isCorrect ? 1 : 0,
          timeSpent: timeSpentSeconds,
        },
        update: {
          masteryLevel: newMastery,
          streak: newStreak,
          questionsAttempted: { increment: 1 },
          questionsCorrect: { increment: isCorrect ? 1 : 0 },
          timeSpent: { increment: timeSpentSeconds },
          lastActivityAt: new Date(),
        },
      });

      this.logger.debug(`Updated mastery for user ${userId} on ${topic}: ${newMastery}%`);

    } catch (error) {
      this.logger.error(`Failed to update topic mastery for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Retrieves mastery overview for a user.
   */
  async getUserMastery(userId: string) {
    return this.prisma.userTopicMastery.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  /**
   * Retrieves the user's weakest topics (low mastery) to recommend content.
   */
  async getWeakestTopics(userId: string, limit: number = 5) {
    return this.prisma.userTopicMastery.findMany({
      where: {
        userId,
        masteryLevel: { lt: 70 }, // threshold for "weak"
      },
      orderBy: [
        { masteryLevel: 'asc' },     // Lowest mastery first
        { lastActivityAt: 'asc' },   // Or least recently practiced
      ],
      take: limit,
    });
  }
}
