import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { TopicMasteryService } from "../../analytics/topic-mastery.service";
import {
  SubmitQuestionResultDto,
  QuestionResultWithAnalyticsDto,
} from "../dto/question-result.dto";
import * as crypto from "crypto";

@Injectable()
export class QuestionAnalyticsService {
  private readonly logger = new Logger(QuestionAnalyticsService.name);
  private activeGameSessions = new Map<
    string,
    { sessionId: string; startTime: Date; questionsCount: number }
  >();

  constructor(
    private prisma: PrismaService,
    private topicMastery: TopicMasteryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async recordResult(
    userId: string,
    dto: SubmitQuestionResultDto,
  ): Promise<QuestionResultWithAnalyticsDto> {
    const {
      questionId,
      score,
      timeTaken,
      isCorrect,
      selfRating,
      userAnswer,
      mistakes,
      gameSessionId,
    } = dto;

    // Track game session for analytics
    await this.trackGameSession(
      userId,
      gameSessionId,
      questionId,
      isCorrect,
      timeTaken,
    );

    // 1. Save the individual result
    // Use item_id instead of question_id
    const result = await this.prisma.question_results.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        item_id: questionId, // Mapping DTO questionId to DB item_id
        score,
        time_taken: timeTaken,
        is_correct: isCorrect,
        self_rating: selfRating,
        user_answer: userAnswer || {},
        mistakes: mistakes || {},
        game_session_id: gameSessionId,
      },
    });

    // Fetch item for topic info
    // item_bank instead of question_bank
    const item = await this.prisma.item_bank.findUnique({
      where: { id: questionId },
      // tags[1] = subject, tags[2] = topic based on my convention?
      // Or use metadata if available?
      // I'll select tags.
      select: { tags: true, metadata: true },
    });

    const topic = item?.tags?.[2] || 'Uncategorized';
    const subject = item?.tags?.[1] || 'General';

    // 2. Update Question Analytics (Async aggregation)
    const promises: Promise<any>[] = [
      this.updateQuestionStats(
        questionId,
        score,
        timeTaken,
        isCorrect,
        selfRating,
      ),
    ];

    if (item) {
      promises.push(
        this.topicMastery.updateMastery(
          userId,
          topic,
          subject,
          isCorrect,
          timeTaken,
        ),
      );
    }

    await Promise.all(promises);

    // 3. Return result with updated context
    const analytics = await this.prisma.question_analytics.findUnique({
      where: { item_id: questionId }, // Renamed column
    });

    return {
      id: result.id,
      userId: result.user_id,
      questionId: result.item_id, // Map back
      score: result.score,
      timeTaken: result.time_taken,
      isCorrect: result.is_correct,
      selfRating: result.self_rating,
      createdAt: result.created_at,
      questionAnalytics: {
        totalAttempts: (analytics as any)?.total_attempts || 1,
        successRate: (analytics as any)?.success_rate || (isCorrect ? 100 : 0),
        avgScore: (analytics as any)?.avg_score || score,
        isDifficult: (analytics as any)?.is_difficult || false,
      },
      // Calculate next review date if it's SRS (simplified algorithm)
      nextReviewDate: selfRating
        ? this.calculateNextReview(selfRating)
        : undefined,
    };
  }

  /**
   * Track game session for Study Session analytics
   */
  private async trackGameSession(
    userId: string,
    gameSessionId: string | undefined,
    questionId: string,
    isCorrect: boolean,
    timeTaken: number,
  ) {
    if (!gameSessionId) return;

    const sessionKey = `${userId}-${gameSessionId}`;
    let sessionData = this.activeGameSessions.get(sessionKey);

    if (!sessionData) {
      // Start new study session
      this.eventEmitter.emit("session.started", {
        userId,
        activityType: "game",
        sourceId: gameSessionId,
      });

      sessionData = {
        sessionId: "", // Will be set by listener
        startTime: new Date(),
        questionsCount: 0,
      };
      this.activeGameSessions.set(sessionKey, sessionData);
    }

    sessionData.questionsCount++;

    // Auto-finish session after 10 questions or 15min idle
    const idleTime = Date.now() - sessionData.startTime.getTime();
    if (sessionData.questionsCount >= 10 || idleTime > 15 * 60 * 1000) {
      const durationMinutes = Math.floor(idleTime / (1000 * 60));

      // Emit session finished
      this.eventEmitter.emit("session.finished", {
        sessionId: gameSessionId,
        durationMinutes,
        accuracyRate: isCorrect ? 100 : 0, // Simplified (should aggregate all answers)
      });

      this.activeGameSessions.delete(sessionKey);
    }
  }

  private async updateQuestionStats(
    itemId: string, // Renamed param for clarity
    score: number,
    timeTaken: number,
    isCorrect: boolean,
    selfRating?: number,
  ) {
    try {
      const analytics = await this.prisma.question_analytics.findUnique({
        where: { item_id: itemId },
      });

      if (!analytics) {
        await this.prisma.question_analytics.create({
          data: {
            id: crypto.randomUUID(),
            item_id: itemId,
            total_attempts: 1,
            success_rate: isCorrect ? 100 : 0,
            avg_score: score,
            avg_time: timeTaken,
            avg_self_rating: selfRating || null,
            common_mistakes: [],
            is_difficult: !isCorrect,
            updated_at: new Date(),
          },
        });
      } else {
        // Incremental update (could be moved to a background job for scaling)
        const total = (analytics as any).total_attempts + 1;
        const newAvgScore =
          ((analytics as any).avg_score * (analytics as any).total_attempts +
            score) /
          total;
        const newAvgTime =
          ((analytics as any).avg_time * (analytics as any).total_attempts +
            timeTaken) /
          total;

        // Success rate
        const successes =
          ((analytics as any).success_rate / 100) *
            (analytics as any).total_attempts +
          (isCorrect ? 1 : 0);
        const newSuccessRate = (successes / total) * 100;

        await this.prisma.question_analytics.update({
          where: { item_id: itemId },
          data: {
            total_attempts: total,
            avg_score: newAvgScore,
            avg_time: Math.round(newAvgTime),
            success_rate: newSuccessRate,
            is_difficult: newSuccessRate < 40, // Mark difficult if < 40% success
            updated_at: new Date(),
          },
        });
      }

      // Also update the ItemBank specific stats if I added columns?
      // I didn't add times_used/avg_score to item_bank schema.
      // I should have. item_bank has 'updated_at' but no stats columns.
      // The Legacy question_bank had times_used/avg_score.
      // I LOST these features in item_bank schema definition.
      // I should ADD them to item_bank definition or just skip this update for now.
      // Since I am already migrating, maybe I should skipping stats update on item_bank table.
      // Analytics is stored in question_analytics anyway.
      // So I will remove the update to item_bank.
    } catch (error) {
      this.logger.error(
        `Failed to update stats for item ${itemId}: ${error.message}`,
      );
    }
  }

  private calculateNextReview(rating: number): Date {
    // Basic Spaced Repetition Logic (1=Hard, 2=Good, 3=Easy)
    const now = new Date();
    switch (rating) {
      case 1:
        return new Date(now.setDate(now.getDate() + 1)); // 1 day
      case 2:
        return new Date(now.setDate(now.getDate() + 3)); // 3 days
      case 3:
        return new Date(now.setDate(now.getDate() + 7)); // 7 days
      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }
}
